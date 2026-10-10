import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, AppError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AccountRole } from './auth.types';
import {
  getAccountProfile,
  loginAccount,
  requestPasswordReset,
  verifyResetOtp,
  refreshAccountToken,
  registerAdmin,
  registerCustomer,
  registerProvider,
  resetAccountPassword,
  sendRegistrationOtp,
  verifyOtpAndCreateAccount,
  resendRegistrationOtp,
  changeAccountPassword,
  updateMyProfile,
  fastHunterAuth,
} from './auth.service';

export const quickAuthController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await fastHunterAuth(req.body);
  res.status(200).json(sendSuccess('Hunter authenticated successfully', result));
});

export const registerCustomerController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await registerCustomer(req.body);
  res.status(201).json(sendSuccess('Customer registered successfully', result));
});

export const registerProviderController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await registerProvider(req.body);
  res.status(201).json(sendSuccess('Provider registered successfully', result));
});

export const registerAdminController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await registerAdmin(req.body);
  res.status(201).json(sendSuccess('Admin account registered successfully', result));
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await loginAccount(req.body);
  res.status(200).json(sendSuccess('Account logged in successfully', result));
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await refreshAccountToken(req.body.refreshToken);
  res.status(200).json(sendSuccess('Access token refreshed successfully', result));
});

export const logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(sendSuccess('Account logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await requestPasswordReset(req.body);
  res.status(200).json(sendSuccess('Password reset request processed successfully', result));
});

export const verifyResetOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await verifyResetOtp(req.body);
  res.status(200).json(sendSuccess('Verification code confirmed successfully', result));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await resetAccountPassword(req.body);
  res.status(200).json(sendSuccess('Password reset completed successfully', result));
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.status(200).json(sendSuccess('Authenticated account profile fetched successfully', getAccountProfile(req.account!, req.auth!.role as AccountRole)));
});

export const sendRegistrationOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await sendRegistrationOtp(req.body);
  res.status(200).json(sendSuccess(result.message, result));
});

export const verifyRegistrationOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await verifyOtpAndCreateAccount(req.body);
  res.status(201).json(sendSuccess('Account verified and created successfully. Welcome to TreasureBox!', result));
});

export const resendRegistrationOtpController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await resendRegistrationOtp(req.body);
  res.status(200).json(sendSuccess(result.message, result));
});

export const changePasswordController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const result = await changeAccountPassword(req.account!, currentPassword, newPassword);
  res.status(200).json(sendSuccess(result.message, result));
});

export const updateMyProfileController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const payload: { name: string; avatar?: string } = { ...req.body };
  if (req.file) {
    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    payload.avatar = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;
  }
  const result = await updateMyProfile(req.account!, req.auth!.role as AccountRole, payload);
  res.status(200).json(sendSuccess('Profile updated successfully', result));
});

export const uploadProfileImageController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError(400, 'No image file uploaded. Please provide an avatar image file.', 'MISSING_FILE');
  }

  const host = req.get('host') || 'localhost:5000';
  const protocol = req.protocol || 'http';
  const avatarUrl = `${protocol}://${host}/uploads/avatars/${req.file.filename}`;

  const currentName = req.account?.name || 'Operator';
  const updatedAccount = await updateMyProfile(req.account!, req.auth!.role as AccountRole, {
    name: currentName,
    avatar: avatarUrl,
  });

  res.status(200).json(sendSuccess('Profile photo uploaded successfully', {
    avatar: avatarUrl,
    account: updatedAccount,
  }));
});

