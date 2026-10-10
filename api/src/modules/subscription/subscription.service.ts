import { Subscription, SubscriptionPlan } from './subscription.model';
import { z } from 'zod';
import { createSubscriptionSchema, upsertSubscriptionPlanSchema } from './subscription.validation';

type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
type UpsertSubscriptionPlanInput = z.infer<typeof upsertSubscriptionPlanSchema>;

export const listMySubscriptions = async (providerId: string) => {
  return Subscription.find({ provider: providerId }).sort({ createdAt: -1 }).lean();
};

export const listAllSubscriptions = async () => {
  return Subscription.find().populate('provider', 'name businessName email').sort({ createdAt: -1 }).lean();
};

export const createProviderSubscription = async (providerId: string, input: CreateSubscriptionInput) => {
  return Subscription.create({ provider: providerId, ...input, status: 'ACTIVE' });
};

export const listActiveSubscriptionPlans = async () => {
  return SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }).lean();
};

export const upsertSubscriptionPlan = async (input: UpsertSubscriptionPlanInput) => {
  return SubscriptionPlan.findOneAndUpdate(
    { planType: input.planType },
    input,
    { upsert: true, returnDocument: 'after', runValidators: true }
  );
};
