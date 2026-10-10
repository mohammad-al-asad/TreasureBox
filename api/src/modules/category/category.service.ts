import { z } from 'zod';
import { Category } from './category.model';
import { AppError } from '../../utils/response';
import { createCategorySchema, updateCategorySchema } from './category.validation';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createCategory = async (input: CreateCategoryInput) => {
  const exists = await Category.exists({ slug: input.slug });
  if (exists) {
    throw new AppError(409, 'Category slug is already in use', 'CATEGORY_SLUG_EXISTS');
  }
  return Category.create(input);
};

export const listCategories = async () => {
  let categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  if (categories.length === 0) {
    const defaultCategories = [
      { name: 'Historic Ruins & Souks', slug: 'historic-ruins', description: 'Ancient heritage sites and old bazaars' },
      { name: 'Desert Expeditions', slug: 'desert-expeditions', description: 'Hidden caches buried across dunes and oases' },
      { name: 'Coastal & Maritime', slug: 'coastal-maritime', description: 'Shipwreck trails and shoreline mysteries' },
      { name: 'Mountain Trails', slug: 'mountain-trails', description: 'High altitude cliffs, canyons and rock carvings' },
      { name: 'Urban Vaults', slug: 'urban-vaults', description: 'Metropolitan secrets and architectural puzzles' },
    ];
    await Category.insertMany(defaultCategories);
    categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  }
  return categories;
};

export const updateCategory = async (categoryId: string, input: UpdateCategoryInput) => {
  const category = await Category.findByIdAndUpdate(categoryId, input, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!category) {
    throw new AppError(404, 'Category was not found for update', 'CATEGORY_NOT_FOUND');
  }
  return category;
};
