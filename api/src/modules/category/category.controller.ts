import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createCategory, listCategories, updateCategory } from './category.service';

export const createCategoryController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await createCategory(req.body);
  res.status(201).json(sendSuccess('Category created successfully', category));
});

export const listCategoryController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await listCategories();
  res.status(200).json(sendSuccess('Categories fetched successfully', categories));
});

export const updateCategoryController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await updateCategory(req.params.categoryId, req.body);
  res.status(200).json(sendSuccess('Category updated successfully', category));
});
