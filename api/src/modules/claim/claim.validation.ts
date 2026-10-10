import { z } from 'zod';

export const submitClaimBodySchema = z.object({
  huntId: z.string().min(24, 'Valid Hunt ID is required'),
  hunterName: z.string().min(2, 'Hunter name must be at least 2 characters'),
  hunterEmail: z.string().email('Valid hunter email is required').optional(),
  proofPhotoUrl: z.string().min(5, 'Proof photo URL or base64 is required'),
  solvedSequence: z.string().optional(),
});

export const verifyClaimBodySchema = z.object({
  claimId: z.string().min(24, 'Valid Claim ID is required'),
  status: z.enum(['VERIFIED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});
