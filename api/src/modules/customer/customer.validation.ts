import { z } from 'zod';

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  avatar: z.string().url().optional(),
  addresses: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(60),
        addressLine: z.string().trim().min(3).max(300),
        city: z.string().trim().min(1).max(100),
        state: z.string().trim().max(100).optional(),
        country: z.string().trim().min(2).max(100),
        postalCode: z.string().trim().max(30).optional(),
        location: z
          .object({
            type: z.literal('Point'),
            coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
          })
          .optional(),
      })
    )
    .max(10)
    .optional(),
});
