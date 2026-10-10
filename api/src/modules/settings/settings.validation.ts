import { z } from 'zod';

export const updateLegalDocBodySchema = z.object({
  type: z.enum(['TERMS', 'PRIVACY', 'ABOUT']),
  title: z.string().min(2, 'Document title is required').optional(),
  content: z.string().min(5, 'Document content is required'),
});

export const getLegalDocParamsSchema = z.object({
  type: z.enum(['TERMS', 'PRIVACY', 'ABOUT', 'terms', 'privacy', 'about']),
});
