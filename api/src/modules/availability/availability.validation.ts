import { z } from 'zod';

export const upsertAvailabilitySchema = z.object({
  weekday: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must use HH:mm format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must use HH:mm format'),
  timezone: z.string().trim().min(1).max(80).default('UTC'),
  isActive: z.boolean().default(true),
});
