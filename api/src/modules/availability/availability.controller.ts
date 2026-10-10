import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createAvailability, listProviderAvailability } from './availability.service';

export const listMyAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const availability = await listProviderAvailability(req.auth!.accountId);
  res.status(200).json(sendSuccess('Availability fetched successfully', availability));
});

export const createMyAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const availability = await createAvailability(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Availability slot created successfully', availability));
});
