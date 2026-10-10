import { z } from 'zod';
import { isValidObjectId } from '../utils/objectId';

export const objectIdParamSchema = z.object({
  id: z.string().refine(isValidObjectId, 'A valid resource ID is required'),
});

export const resourceIdParamSchema = (key: string) =>
  z.object({
    [key]: z.string().refine(isValidObjectId, `A valid ${key} is required`),
  });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const languageQuerySchema = z.object({
  language: z.enum(['en', 'ar']).optional(),
});

export const geoSearchQuerySchema = paginationQuerySchema.extend({
  city: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().optional(),
  service: z.string().trim().optional(),
  availableNow: z.coerce.boolean().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(250).default(25),
});
