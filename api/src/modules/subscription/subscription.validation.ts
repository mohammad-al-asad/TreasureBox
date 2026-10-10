import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  planName: z.string().trim().min(2).max(100),
  planType: z.enum(['PAY_AS_YOU_GO', 'MONTHLY', 'ANNUAL']),
  price: z.number().min(0),
  currency: z.string().trim().length(3).toLowerCase(),
});

export const upsertSubscriptionPlanSchema = z.object({
  name: z.string().trim().min(2).max(100),
  planType: z.enum(['PAY_AS_YOU_GO', 'MONTHLY', 'ANNUAL']),
  price: z.number().min(0),
  currency: z.string().trim().length(3).toLowerCase(),
  features: z.array(z.string().trim().min(1).max(160)).max(30).default([]),
  isActive: z.boolean().default(true),
});
