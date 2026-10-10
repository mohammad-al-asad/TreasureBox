import { z } from 'zod';
import { AuthRole } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/response';
import { SupportTicket } from './support.model';
import { createSupportTicketSchema, updateSupportTicketSchema } from './support.validation';

type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;

export const createSupportTicket = async (requester: string, requesterRole: AuthRole, input: CreateSupportTicketInput) => {
  if (requesterRole === 'ADMIN') {
    throw new AppError(403, 'Admin accounts cannot create customer/provider support tickets', 'SUPPORT_ROLE_NOT_ALLOWED');
  }

  return SupportTicket.create({ requester, requesterRole, ...input });
};

export const listSupportTickets = async (accountId: string, role: AuthRole) => {
  const filter = role === 'ADMIN' ? {} : { requester: accountId, requesterRole: role };
  return SupportTicket.find(filter).sort({ createdAt: -1 }).lean();
};

export const updateSupportTicket = async (ticketId: string, input: UpdateSupportTicketInput) => {
  const ticket = await SupportTicket.findByIdAndUpdate(ticketId, input, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!ticket) {
    throw new AppError(404, 'Support ticket was not found for update', 'SUPPORT_TICKET_NOT_FOUND');
  }

  return ticket;
};
