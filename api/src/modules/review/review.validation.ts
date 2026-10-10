import { z } from 'zod';

export const createReviewSchema = z.object({
  booking: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1200).optional(),
});
