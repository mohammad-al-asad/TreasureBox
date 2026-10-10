import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createCategoryController, listCategoryController, updateCategoryController } from './category.controller';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();

// Action-Oriented Category Endpoints
router.get('/get-all-categories', listCategoryController);
router.post('/create-new-category', authenticate, authorizeAdmin, validateRequest({ body: createCategorySchema }), createCategoryController);
router.patch('/update-category/:categoryId', authenticate, authorizeAdmin, validateRequest({ body: updateCategorySchema }), updateCategoryController);

// Legacy routes for backwards compatibility
router.get('/', listCategoryController);
router.post('/', authenticate, authorizeAdmin, validateRequest({ body: createCategorySchema }), createCategoryController);
router.patch('/:categoryId', authenticate, authorizeAdmin, validateRequest({ body: updateCategorySchema }), updateCategoryController);

export default router;
