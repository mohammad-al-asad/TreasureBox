import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/, 'Slug can contain lowercase letters, numbers, and hyphens'),
  description: z.string().trim().max(500).optional(),
  icon: z.string().url().optional(),
  parentCategory: z.string().trim().optional(),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
