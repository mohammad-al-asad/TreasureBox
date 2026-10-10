import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getProviderById, getProviderDashboard, listVerifiedProviders, updateProvider } from './provider.service';

export const listProviders = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const providers = await listVerifiedProviders(_req.query as never);
  res.status(200).json(sendSuccess('Verified providers fetched successfully', providers));
});

export const getProvider = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const provider = await getProviderById(req.params.providerId);
  res.status(200).json(sendSuccess('Provider profile fetched successfully', provider));
});

export const getMyProviderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const provider = await getProviderById(req.auth!.accountId);
  res.status(200).json(sendSuccess('Provider profile fetched successfully', provider));
});

export const updateMyProviderProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const provider = await updateProvider(req.auth!.accountId, req.body);
  res.status(200).json(sendSuccess('Provider profile updated successfully', provider));
});

export const getMyProviderDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const dashboard = await getProviderDashboard(req.auth!.accountId);
  res.status(200).json(sendSuccess('Provider dashboard fetched successfully', dashboard));
});
