import { z } from 'zod';

export const createServiceSchema = z.object({
  category: z.string().trim().min(1),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(20).max(2500),
  basePrice: z.number().min(0),
  priceUnit: z.enum(['FIXED', 'HOURLY', 'DAILY']).default('FIXED'),
  durationMinutes: z.number().int().min(15).max(1440),
  images: z.array(z.string().url()).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();
