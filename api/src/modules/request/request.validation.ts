import { z } from 'zod';

export const createRequestSchema = z.object({
  provider: z.string().trim().min(1),
  category: z.string().trim().min(1),
  service: z.string().trim().min(1).optional(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(20).max(2500),
  preferredDate: z.coerce.date(),
  address: z.string().trim().min(3).max(500),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
});

export const updateRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELED', 'NO_SHOW']),
  note: z.string().trim().max(500).optional(),
});

export const customerConfirmRequestSchema = z.object({
  confirm: z.literal(true),
});
