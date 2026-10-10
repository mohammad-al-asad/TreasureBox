import { z } from 'zod';

export const updateProviderSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatar: z.string().url().optional(),
  businessName: z.string().trim().min(2).max(140).optional(),
  bio: z.string().trim().max(1200).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  address: z.string().trim().max(500).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  businessHours: z
    .array(
      z.object({
        weekday: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
        openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Open time must use HH:mm format'),
        closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Close time must use HH:mm format'),
        isClosed: z.boolean().default(false),
      })
    )
    .max(7)
    .optional(),
  serviceRadiusKm: z.number().int().min(1).max(250).optional(),
  location: z
    .object({
      type: z.literal('Point'),
      coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
    })
    .optional(),
  availabilityStatus: z.enum(['ONLINE', 'OFFLINE', 'BUSY']).optional(),
});
