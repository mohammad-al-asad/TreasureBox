import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createReview, listProviderReviews } from './review.service';

export const createReviewController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const review = await createReview(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Review created successfully', review));
});

export const listProviderReviewsController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reviews = await listProviderReviews(req.params.providerId);
  res.status(200).json(sendSuccess('Provider reviews fetched successfully', reviews));
});
