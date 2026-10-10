import { z } from 'zod';

export const verifyProviderSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
});

export const moderateReviewSchema = z.object({
  moderationStatus: z.enum(['VISIBLE', 'HIDDEN', 'FLAGGED']),
  moderationNote: z.string().trim().max(500).optional(),
});

export const createAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(128),
  role: z.enum(['ADMIN', 'SUPERADMIN']).default('ADMIN'),
});
