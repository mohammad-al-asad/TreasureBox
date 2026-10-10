import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createSupportTicket, listSupportTickets, updateSupportTicket } from './support.service';

export const createSupportTicketController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await createSupportTicket(req.auth!.accountId, req.auth!.role, req.body);
  res.status(201).json(sendSuccess('Support ticket created successfully', ticket));
});

export const listSupportTicketsController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const tickets = await listSupportTickets(req.auth!.accountId, req.auth!.role);
  res.status(200).json(sendSuccess('Support tickets fetched successfully', tickets));
});

export const updateSupportTicketController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const ticket = await updateSupportTicket(req.params.ticketId, req.body);
  res.status(200).json(sendSuccess('Support ticket updated successfully', ticket));
});
