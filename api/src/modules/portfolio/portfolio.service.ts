import { z } from 'zod';
import { PortfolioItem } from './portfolio.model';
import { createPortfolioSchema } from './portfolio.validation';

type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;

export const createPortfolioItem = async (providerId: string, input: CreatePortfolioInput) => {
  return PortfolioItem.create({ ...input, provider: providerId });
};

export const listProviderPortfolio = async (providerId: string) => {
  return PortfolioItem.find({ provider: providerId }).sort({ createdAt: -1 }).lean();
};
