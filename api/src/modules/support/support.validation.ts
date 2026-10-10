import { z } from 'zod';

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(3000),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  adminNote: z.string().trim().max(2000).optional(),
});
