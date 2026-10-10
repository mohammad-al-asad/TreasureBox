import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createProviderService, listActiveServices, updateProviderService } from './service.service';

export const createServiceController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const service = await createProviderService(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Service created successfully', service));
});

export const listServicesController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const services = await listActiveServices();
  res.status(200).json(sendSuccess('Services fetched successfully', services));
});

export const updateServiceController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const service = await updateProviderService(req.auth!.accountId, req.params.serviceId, req.body);
  res.status(200).json(sendSuccess('Service updated successfully', service));
});
