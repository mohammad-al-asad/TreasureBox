import { z } from 'zod';

export const createBookingSchema = z.object({
  provider: z.string().trim().min(1),
  service: z.string().trim().min(1),
  scheduledAt: z.coerce.date(),
  address: z.string().trim().min(3).max(500),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  cancellationReason: z.string().trim().max(500).optional(),
});
