import { z } from 'zod';
import { Types } from 'mongoose';

const objectIdSchema = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), { message: 'Invalid MongoDB ObjectId' });

export const getAllUsersQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['Active', 'Suspended', 'ALL']).optional(),
});

export const userIdParamsSchema = z.object({
  id: objectIdSchema,
});

export const resetUserAccessBodySchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
});
