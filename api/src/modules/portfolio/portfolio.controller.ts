import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createPortfolioItem, listProviderPortfolio } from './portfolio.service';

export const createPortfolioController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const item = await createPortfolioItem(req.auth!.accountId, req.body);
  res.status(201).json(sendSuccess('Portfolio item created successfully', item));
});

export const listPortfolioController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const items = await listProviderPortfolio(req.params.providerId);
  res.status(200).json(sendSuccess('Provider portfolio fetched successfully', items));
});
