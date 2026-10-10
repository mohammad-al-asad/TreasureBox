import { z } from 'zod';

export const createPayPalOrderBodySchema = z.object({
  huntId: z.string().min(24, 'Valid Hunt ID is required'),
  hunterName: z.string().min(2, 'Hunter name is required'),
  hunterEmail: z.string().email('Valid hunter email is required'),
  returnUrl: z.string().url('returnUrl must be a valid URL').optional(),
  cancelUrl: z.string().url('cancelUrl must be a valid URL').optional(),
});

export const capturePayPalOrderBodySchema = z.object({
  paypalOrderId: z.string().min(3, 'PayPal Order ID is required'),
  paypalCaptureId: z.string().optional(),
});

export const purchaseHuntPermitBodySchema = z.object({
  huntId: z.string().min(24, 'Valid Hunt ID is required'),
  hunterName: z.string().min(2, 'Hunter name is required'),
  hunterEmail: z.string().email('Valid hunter email is required'),
  paymentMethod: z
    .enum(['PAYPAL', 'IN_APP_CHECKOUT', 'FREE_PERMIT', 'CARD', 'STRIPE'])
    .optional()
    .default('IN_APP_CHECKOUT'),
});

