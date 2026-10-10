import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { confirmAcceptedRequest, createCustomerRequest, listRequestsForAccount, updateRequestLifecycleStatus } from './request.service';

export const createRequestController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const request = await createCustomerRequest(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Service request created successfully', request));
});

export const listRequestsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const req = _req as AuthenticatedRequest;
  const requests = await listRequestsForAccount(req.auth!.accountId, req.auth!.role);
  res.status(200).json(sendSuccess('Walk-in service requests fetched successfully', requests));
});

export const updateRequestStatusController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const request = await updateRequestLifecycleStatus(req.auth!.accountId, req.auth!.role, req.params.requestId, req.body);
  res.status(200).json(sendSuccess('Walk-in request status updated successfully', request));
});

export const confirmRequestController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const request = await confirmAcceptedRequest(req.auth!.accountId, req.params.requestId);
  res.status(200).json(sendSuccess('Walk-in request confirmation recorded successfully', request));
});
