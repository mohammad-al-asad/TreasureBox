import Stripe from 'stripe';
import { env } from './env';

export const stripeClient = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null;
