import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getCustomerById, updateCustomer } from './customer.service';

export const getMyCustomerProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const customer = await getCustomerById(req.auth!.accountId);
  res.status(200).json(sendSuccess('Customer profile fetched successfully', customer));
});

export const updateMyCustomerProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const customer = await updateCustomer(req.auth!.accountId, req.body);
  res.status(200).json(sendSuccess('Customer profile updated successfully', customer));
});
