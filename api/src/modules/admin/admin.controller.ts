import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import {
  getDashboardStats,
  listAdminCustomers,
  listAdminPayments,
  listAdminProviders,
  listAdminRequests,
  listAdminReviews,
  moderateReview,
  verifyProviderAccount,
  getAllAdmins,
  createNewAdmin,
  toggleAdminStatus,
  deleteAdmin,
} from './admin.service';

export const dashboardController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = await getDashboardStats();
  res.status(200).json(sendSuccess('Admin dashboard statistics fetched successfully', stats));
});

export const verifyProviderController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const provider = await verifyProviderAccount(req.params.providerId, req.body.verificationStatus);
  res.status(200).json(sendSuccess('Provider verification status updated successfully', provider));
});

export const listAdminCustomersController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const customers = await listAdminCustomers();
  res.status(200).json(sendSuccess('Customers fetched successfully', customers));
});

export const listAdminProvidersController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const providers = await listAdminProviders();
  res.status(200).json(sendSuccess('Providers fetched successfully', providers));
});

export const listAdminRequestsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const requests = await listAdminRequests();
  res.status(200).json(sendSuccess('Walk-in requests fetched successfully', requests));
});

export const listAdminPaymentsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const payments = await listAdminPayments();
  res.status(200).json(sendSuccess('Payments fetched successfully', payments));
});

export const listAdminReviewsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const reviews = await listAdminReviews();
  res.status(200).json(sendSuccess('Reviews fetched successfully', reviews));
});

export const moderateReviewController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await moderateReview(req.params.reviewId, req.body);
  res.status(200).json(sendSuccess('Review moderation status updated successfully', review));
});

export const getAllAdminsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const admins = await getAllAdmins();
  res.status(200).json(sendSuccess('Administrators fetched successfully', admins));
});

export const createNewAdminController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const newAdmin = await createNewAdmin(req.body);
  res.status(201).json(sendSuccess('Administrator account created successfully', newAdmin));
});

export const toggleAdminStatusController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentAdminId = req.account ? String((req.account as any)._id) : undefined;
  const updatedAdmin = await toggleAdminStatus(req.params.id, currentAdminId);
  res.status(200).json(sendSuccess('Administrator status updated successfully', updatedAdmin));
});

export const deleteAdminController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentAdminId = req.account ? String((req.account as any)._id) : undefined;
  const result = await deleteAdmin(req.params.id, currentAdminId);
  res.status(200).json(sendSuccess(result.message, result));
});
