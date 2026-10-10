import { z } from 'zod';
import crypto from 'crypto';
import { Admin, IAdmin } from '../admin/admin.model';
import { Customer, ICustomer } from '../customer/customer.model';
import { IProvider, Provider } from '../provider/provider.model';
import { comparePassword, hashPassword } from '../../utils/password';
import { AppError } from '../../utils/response';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import {
  adminRegisterSchema,
  customerRegisterSchema,
  forgotPasswordSchema,
  loginSchema,
  providerRegisterSchema,
  resetPasswordSchema,
  sendRegistrationOtpSchema,
  verifyRegistrationOtpSchema,
  resendRegistrationOtpSchema,
  verifyResetOtpSchema,
} from './auth.validation';
import { AccountRole, AuthAccountResponse, AuthTokenResponse } from './auth.types';
import { Otp } from './otp.model';
import { mailerService } from '../../services/mailer.service';
import { getRegistrationOtpTemplate, getPasswordResetOtpTemplate } from '../../utils/emailTemplates';
import { User } from '../user/user.model';
import { IUserDocument } from '../user/user.interface';

type SendRegistrationOtpInput = z.infer<typeof sendRegistrationOtpSchema>;
type VerifyRegistrationOtpInput = z.infer<typeof verifyRegistrationOtpSchema>;
type ResendRegistrationOtpInput = z.infer<typeof resendRegistrationOtpSchema>;

type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
type ProviderRegisterInput = z.infer<typeof providerRegisterSchema>;
type AdminRegisterInput = z.infer<typeof adminRegisterSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export interface IAuthAccountDocument {
  _id: any;
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  save?: () => Promise<any>;
  [key: string]: any;
}
type AccountDocument = IAuthAccountDocument;

const sanitizeAccount = (account: AccountDocument, role: AccountRole): AuthAccountResponse => ({
  id: String(account._id),
  role,
  name: account.name || '',
  email: account.email || '',
  status: (account as any).status || 'ACTIVE',
  avatar: (account as any).avatar || '',
});

const buildAuthResponse = (account: AccountDocument, role: AccountRole): AuthTokenResponse => {
  const payload = { accountId: String(account._id), role };

  return {
    account: sanitizeAccount(account, role),
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const ensureEmailIsAvailable = async (email: string): Promise<void> => {
  const [customer, provider, admin] = await Promise.all([
    Customer.exists({ email }),
    Provider.exists({ email }),
    Admin.exists({ email }),
  ]);

  if (customer || provider || admin) {
    throw new AppError(409, 'Email address is already registered for an account', 'EMAIL_ALREADY_EXISTS');
  }
};

export const registerCustomer = async (input: CustomerRegisterInput): Promise<AuthTokenResponse> => {
  await ensureEmailIsAvailable(input.email);
  const customer = await Customer.create({
    ...input,
    password: await hashPassword(input.password),
  });

  return buildAuthResponse(customer, 'USER');
};

export const registerProvider = async (input: ProviderRegisterInput): Promise<AuthTokenResponse> => {
  await ensureEmailIsAvailable(input.email);
  const provider = await Provider.create({
    ...input,
    password: await hashPassword(input.password),
  });

  return buildAuthResponse(provider, 'USER');
};

export const registerAdmin = async (input: AdminRegisterInput): Promise<AuthTokenResponse> => {
  await ensureEmailIsAvailable(input.email);
  const role: AccountRole = input.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
  const admin = await Admin.create({
    ...input,
    role,
    password: await hashPassword(input.password),
  });

  return buildAuthResponse(admin, role);
};

const findAccountForLogin = async (
  input: LoginInput
): Promise<{ account: AccountDocument; role: AccountRole } | null> => {
  if (input.role === 'USER') {
    const user =
      (await User.findOne({ email: input.email }).select('+password')) ||
      (await Customer.findOne({ email: input.email }).select('+password'));
    if (!user) return null;
    return { account: user, role: 'USER' };
  }

  // ADMIN or SUPERADMIN requested
  const admin = await Admin.findOne({ email: input.email }).select('+password');
  if (admin) {
    const resolvedRole: AccountRole = admin.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN';
    return { account: admin, role: resolvedRole };
  }

  const elevatedUser = await User.findOne({ email: input.email }).select('+password');
  if (elevatedUser && (elevatedUser.role === 'ADMIN' || elevatedUser.role === 'SUPERADMIN')) {
    return { account: elevatedUser, role: elevatedUser.role };
  }

  return null;
};

export const loginAccount = async (input: LoginInput): Promise<AuthTokenResponse> => {
  const result = await findAccountForLogin(input);
  
  if (!result || !result.account) {
    throw new AppError(404, 'No account found with this email address.', 'USER_NOT_FOUND');
  }

  if (!result.account.password) {
    throw new AppError(400, 'This account is linked to a social login or lacks a password.', 'PASSWORD_NOT_SET');
  }

  const { account, role } = result;
  const status = (account as any).status;

  if (status === 'SUSPENDED' || status === 'DISABLED' || status === 'Suspended') {
    throw new AppError(403, 'This account is not allowed to sign in', 'ACCOUNT_ACCESS_DISABLED');
  }

  const passwordMatches = await comparePassword(input.password, account.password as string);
  if (!passwordMatches) {
    throw new AppError(401, 'The password you entered is incorrect.', 'INVALID_PASSWORD');
  }

  return buildAuthResponse(account, role);
};

export const refreshAccountToken = async (refreshToken: string): Promise<AuthTokenResponse> => {
  const payload = verifyRefreshToken(refreshToken);
  const account =
    payload.role === 'USER'
      ? (await User.findById(payload.accountId)) || (await Customer.findById(payload.accountId))
      : await Admin.findById(payload.accountId);

  if (!account) {
    throw new AppError(401, 'Refresh token account no longer exists', 'REFRESH_TOKEN_ACCOUNT_NOT_FOUND');
  }

  return buildAuthResponse(account, payload.role as AccountRole);
};

export const getAccountProfile = (account: AccountDocument, role: AccountRole): AuthAccountResponse => {
  return sanitizeAccount(account, role);
};

export const requestPasswordReset = async (input: ForgotPasswordInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  let account: any = null;
  if (input.role === 'ADMIN' || input.role === 'SUPERADMIN') {
    account = await Admin.findOne({ email: normalizedEmail });
    if (!account) {
      account = await User.findOne({ email: normalizedEmail });
    }
  } else {
    account =
      (await User.findOne({ email: normalizedEmail })) ||
      (await Customer.findOne({ email: normalizedEmail })) ||
      (await Admin.findOne({ email: normalizedEmail }));
  }

  if (!account) {
    throw new AppError(404, 'No active operator or user account found with this email address.', 'ACCOUNT_NOT_FOUND');
  }

  // Generate secure 6-digit numeric OTP (100000 - 999999)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const validityMinutes = 1;
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  // Remove existing unverified/stale PASSWORD_RESET OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail, purpose: 'PASSWORD_RESET' });

  await Otp.create({
    email: normalizedEmail,
    otp: otpCode,
    purpose: 'PASSWORD_RESET',
    expiresAt,
    attempts: 0,
    verified: false,
  });

  const accountName = account.name || (input.role === 'ADMIN' ? 'Operator' : 'Explorer');
  const emailHtml = getPasswordResetOtpTemplate(otpCode, accountName, validityMinutes);

  await mailerService.sendMail({
    to: normalizedEmail,
    subject: `Your 6-Digit Password Reset Code: ${otpCode} - TreasureBox`,
    html: emailHtml,
  });

  return {
    email: normalizedEmail,
    expiresInMinutes: validityMinutes,
    message: `A 6-digit verification code has been dispatched to ${normalizedEmail}`,
  };
};

export const verifyResetOtp = async (input: VerifyResetOtpInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'PASSWORD_RESET',
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new AppError(400, 'Verification code has expired or was not requested. Please request a new code.', 'OTP_EXPIRED_OR_INVALID');
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new AppError(429, 'Too many invalid attempts. Please request a new verification code.', 'TOO_MANY_ATTEMPTS');
  }

  if (otpRecord.otp !== input.otp.trim()) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError(400, 'Invalid 6-digit verification code. Please check your email.', 'INVALID_OTP');
  }

  otpRecord.verified = true;
  await otpRecord.save();

  return {
    email: normalizedEmail,
    verified: true,
    message: 'Verification code confirmed. Please proceed to set your new password.',
  };
};

export const resetAccountPassword = async (input: ResetPasswordInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'PASSWORD_RESET',
    otp: input.otp.trim(),
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new AppError(400, 'Verification code is invalid or has expired. Please request a new code.', 'OTP_EXPIRED_OR_INVALID');
  }

  let account: any = null;
  if (input.role === 'ADMIN' || input.role === 'SUPERADMIN') {
    account = await Admin.findOne({ email: normalizedEmail }).select('+password');
    if (!account) {
      account = await User.findOne({ email: normalizedEmail }).select('+password');
    }
  } else {
    account =
      (await User.findOne({ email: normalizedEmail }).select('+password')) ||
      (await Customer.findOne({ email: normalizedEmail }).select('+password')) ||
      (await Admin.findOne({ email: normalizedEmail }).select('+password'));
  }

  if (!account) {
    throw new AppError(404, 'No account matching this email was found.', 'ACCOUNT_NOT_FOUND');
  }

  account.password = await hashPassword(input.newPassword);
  if (account.passwordResetTokenHash !== undefined) {
    account.passwordResetTokenHash = undefined;
    account.passwordResetExpiresAt = undefined;
  }
  await account.save();

  // Cleanup OTP records for this email
  await Otp.deleteMany({ email: normalizedEmail, purpose: 'PASSWORD_RESET' });

  return {
    success: true,
    message: 'Password successfully reset. You may now sign in with your new password.',
  };
};

export const sendRegistrationOtp = async (input: SendRegistrationOtpInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();
  await ensureEmailIsAvailable(normalizedEmail);

  // Generate secure 4-digit code (1000 - 9999)
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const validityMinutes = 1;
  const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

  // Remove any stale unverified OTPs for this email
  await Otp.deleteMany({ email: normalizedEmail, purpose: 'REGISTRATION' });

  await Otp.create({
    email: normalizedEmail,
    otp: otpCode,
    purpose: 'REGISTRATION',
    expiresAt,
    attempts: 0,
    verified: false,
  });

  const emailHtml = getRegistrationOtpTemplate(otpCode, input.name, validityMinutes);
  mailerService.sendMail({
    to: normalizedEmail,
    subject: `Your 4-Digit Verification Code: ${otpCode} - TreasureBox`,
    html: emailHtml,
  }).catch((err) => {
    // Non-blocking log to prevent buffering/timeouts
    console.warn(`[Mailer Warning] Failed to dispatch registration OTP email to ${normalizedEmail}:`, err?.message || err);
  });

  return {
    email: normalizedEmail,
    expiresInMinutes: validityMinutes,
    message: `Verification code successfully sent to ${normalizedEmail}`,
  };
};

export const verifyOtpAndCreateAccount = async (input: VerifyRegistrationOtpInput): Promise<AuthTokenResponse> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  await ensureEmailIsAvailable(normalizedEmail);

  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    purpose: 'REGISTRATION',
    verified: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    throw new AppError(400, 'Verification code has expired or was not requested. Please request a new code.', 'OTP_EXPIRED_OR_INVALID');
  }

  if (otpRecord.attempts >= 5) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new AppError(429, 'Too many invalid attempts. Please request a new verification code.', 'TOO_MANY_ATTEMPTS');
  }

  if (otpRecord.otp !== input.otp.trim()) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    throw new AppError(400, 'Invalid 4-digit verification code. Please check your email.', 'INVALID_OTP');
  }

  // Mark OTP as verified & cleanup
  otpRecord.verified = true;
  await otpRecord.save();
  await Otp.deleteMany({ email: normalizedEmail, purpose: 'REGISTRATION' });

  // Create new verified Explorer account in User collection with role USER
  const user = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    password: await hashPassword(input.password),
    role: 'USER',
    status: 'Active',
    joinedDate: new Date().toLocaleDateString('en-GB'),
  });

  return buildAuthResponse(user, 'USER');
};

export const resendRegistrationOtp = async (input: ResendRegistrationOtpInput) => {
  return sendRegistrationOtp({
    email: input.email,
    name: input.name || 'Hunter',
  });
};

export const changeAccountPassword = async (
  account: AccountDocument,
  currentPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> => {
  const role = (account as any).role || 'ADMIN';
  let fullAccount: any = null;

  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    fullAccount = await Admin.findById(account._id).select('+password');
    if (!fullAccount) {
      fullAccount = await User.findById(account._id).select('+password');
    }
  } else {
    fullAccount = await User.findById(account._id).select('+password');
  }

  if (!fullAccount || !fullAccount.password) {
    throw new AppError(404, 'Account record not found to change credentials', 'ACCOUNT_NOT_FOUND');
  }

  const isCurrentValid = await comparePassword(currentPass, fullAccount.password);
  if (!isCurrentValid) {
    throw new AppError(400, 'Current password provided is incorrect', 'INVALID_CURRENT_PASSWORD');
  }

  fullAccount.password = await hashPassword(newPass);
  await fullAccount.save();

  return {
    success: true,
    message: 'Password successfully updated',
  };
};

export const updateMyProfile = async (
  account: AccountDocument,
  role: AccountRole,
  input: { name: string; avatar?: string }
): Promise<AuthAccountResponse> => {
  const trimmedName = input.name.trim();
  const updateData: { name: string; avatar?: string } = { name: trimmedName };
  if (input.avatar !== undefined) {
    updateData.avatar = input.avatar;
  }
  let updatedAccount: any = null;

  if (role === 'ADMIN' || role === 'SUPERADMIN') {
    updatedAccount = await Admin.findByIdAndUpdate(
      account._id,
      { $set: updateData },
      { returnDocument: 'after' }
    );
    if (!updatedAccount) {
      updatedAccount = await User.findByIdAndUpdate(
        account._id,
        { $set: updateData },
        { returnDocument: 'after' }
      );
    }
  } else {
    updatedAccount =
      (await User.findByIdAndUpdate(account._id, { $set: updateData }, { returnDocument: 'after' })) ||
      (await Customer.findByIdAndUpdate(account._id, { $set: updateData }, { returnDocument: 'after' }));
  }

  if (!updatedAccount) {
    throw new AppError(404, 'Account record not found to update profile', 'ACCOUNT_NOT_FOUND');
  }

  return sanitizeAccount(updatedAccount, role);
};

export const fastHunterAuth = async (input: {
  email: string;
  name?: string;
  password?: string;
  avatar?: string;
}): Promise<AuthTokenResponse> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    if (input.password) {
      const fullUser = await User.findOne({ email: normalizedEmail }).select('+password');
      if (fullUser?.password) {
        const isMatch = await comparePassword(input.password, fullUser.password);
        if (!isMatch) {
          throw new AppError(400, 'Incorrect password for this email.', 'INVALID_CREDENTIALS');
        }
      }
    }
    if (input.name && (!user.name || user.name === 'Explorer')) {
      user.name = input.name.trim();
      await user.save();
    }
  } else {
    const hashedPassword = input.password ? await hashPassword(input.password) : undefined;
    user = await User.create({
      name: input.name?.trim() || normalizedEmail.split('@')[0] || 'Explorer',
      email: normalizedEmail,
      password: hashedPassword,
      avatar: input.avatar,
      role: 'USER',
      status: 'Active',
      joinedDate: new Date().toLocaleDateString('en-GB'),
    });
  }

  return buildAuthResponse(user, 'USER');
};



