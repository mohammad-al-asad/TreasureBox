import { Booking } from '../booking/booking.model';
import { Customer } from '../customer/customer.model';
import { Provider } from '../provider/provider.model';
import { Report } from '../report/report.model';
import { AdminDashboardStats } from './admin.types';
import { Provider as ProviderModel } from '../provider/provider.model';
import { AppError } from '../../utils/response';
import { ServiceRequest } from '../request/request.model';
import { Payment } from '../payment/payment.model';
import { Review } from '../review/review.model';
import { Admin } from './admin.model';
import { User } from '../user/user.model';
import { hashPassword } from '../../utils/password';

export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const [customers, providers, bookings, openReports] = await Promise.all([
    Customer.countDocuments(),
    Provider.countDocuments(),
    Booking.countDocuments(),
    Report.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } }),
  ]);

  return { customers, providers, bookings, openReports };
};

export const verifyProviderAccount = async (providerId: string, verificationStatus: 'VERIFIED' | 'REJECTED') => {
  const provider = await ProviderModel.findByIdAndUpdate(
    providerId,
    { verificationStatus },
    { returnDocument: 'after', runValidators: true }
  ).select('-password');

  if (!provider) {
    throw new AppError(404, 'Provider was not found for verification update', 'PROVIDER_NOT_FOUND');
  }

  return provider;
};

export const listAdminCustomers = async () => {
  return Customer.find().select('-password').sort({ createdAt: -1 }).lean();
};

export const listAdminProviders = async () => {
  return Provider.find().select('-password').sort({ createdAt: -1 }).lean();
};

export const listAdminRequests = async () => {
  return ServiceRequest.find()
    .populate('customer', 'name email phone')
    .populate('provider', 'name businessName email phone')
    .populate('category', 'name slug')
    .populate('service', 'title basePrice')
    .sort({ createdAt: -1 })
    .lean();
};

export const listAdminPayments = async () => {
  return Payment.find()
    .populate('booking', 'scheduledAt status paymentStatus')
    .populate('customer', 'name email')
    .populate('provider', 'name businessName email')
    .sort({ createdAt: -1 })
    .lean();
};

export const listAdminReviews = async () => {
  return Review.find()
    .populate('customer', 'name email')
    .populate('provider', 'name businessName email')
    .sort({ createdAt: -1 })
    .lean();
};

export const moderateReview = async (
  reviewId: string,
  input: { moderationStatus: 'VISIBLE' | 'HIDDEN' | 'FLAGGED'; moderationNote?: string }
) => {
  const review = await Review.findByIdAndUpdate(reviewId, input, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!review) {
    throw new AppError(404, 'Review was not found for moderation', 'REVIEW_NOT_FOUND');
  }

  return review;
};

export const getAllAdmins = async () => {
  return Admin.find().select('-password').sort({ createdAt: -1 }).lean();
};

export const createNewAdmin = async (input: {
  name: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'SUPERADMIN';
}) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingAdmin = await Admin.findOne({ email: normalizedEmail });
  if (existingAdmin) {
    throw new AppError(409, 'An administrator account already exists with this email address.', 'EMAIL_ALREADY_EXISTS');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError(409, 'This email address is already in use by another user account.', 'EMAIL_ALREADY_EXISTS');
  }

  const hashedPassword = await hashPassword(input.password);
  const admin = await Admin.create({
    name: input.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: input.role || 'ADMIN',
    status: 'ACTIVE',
    permissions: ['*'],
  });

  const adminObj: any = admin.toObject();
  delete adminObj.password;
  return adminObj;
};

export const toggleAdminStatus = async (adminId: string, currentSuperAdminId?: string) => {
  if (currentSuperAdminId && String(adminId) === String(currentSuperAdminId)) {
    throw new AppError(400, 'You cannot disable your own administrator account.', 'CANNOT_MODIFY_SELF');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError(404, 'Administrator account not found.', 'ADMIN_NOT_FOUND');
  }

  admin.status = admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  await admin.save();

  const adminObj: any = admin.toObject();
  delete adminObj.password;
  return adminObj;
};

export const deleteAdmin = async (adminId: string, currentSuperAdminId?: string) => {
  if (currentSuperAdminId && String(adminId) === String(currentSuperAdminId)) {
    throw new AppError(400, 'You cannot delete your own administrator account.', 'CANNOT_DELETE_SELF');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new AppError(404, 'Administrator account not found.', 'ADMIN_NOT_FOUND');
  }

  await Admin.deleteOne({ _id: adminId });
  return { success: true, message: 'Administrator account deleted successfully.' };
};
