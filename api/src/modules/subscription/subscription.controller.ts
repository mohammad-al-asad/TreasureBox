import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import {
  createProviderSubscription,
  listActiveSubscriptionPlans,
  listAllSubscriptions,
  listMySubscriptions,
  upsertSubscriptionPlan,
} from './subscription.service';

export const listMySubscriptionsController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const subscriptions = await listMySubscriptions(req.auth!.accountId);
  res.status(200).json(sendSuccess('Provider subscriptions fetched successfully', subscriptions));
});

export const createSubscriptionController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const subscription = await createProviderSubscription(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Provider subscription created successfully', subscription));
});

export const listAllSubscriptionsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const subscriptions = await listAllSubscriptions();
  res.status(200).json(sendSuccess('All subscriptions fetched successfully', subscriptions));
});

export const listSubscriptionPlansController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const plans = await listActiveSubscriptionPlans();
  res.status(200).json(sendSuccess('Subscription plans fetched successfully', plans));
});

export const upsertSubscriptionPlanController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const plan = await upsertSubscriptionPlan(req.body);
  res.status(200).json(sendSuccess('Subscription plan saved successfully', plan));
});
