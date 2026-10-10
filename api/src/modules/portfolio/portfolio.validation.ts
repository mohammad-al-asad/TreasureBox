import { z } from 'zod';

export const createPortfolioSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1200).optional(),
  images: z.array(z.string().url()).min(1).max(12),
  completedAt: z.coerce.date().optional(),
});
