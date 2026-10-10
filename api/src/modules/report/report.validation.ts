import { z } from 'zod';

export const createReportSchema = z.object({
  target: z.string().trim().min(1),
  targetRole: z.enum(['CUSTOMER', 'PROVIDER']),
  reason: z.string().trim().min(3).max(160),
  details: z.string().trim().max(2000).optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
});
