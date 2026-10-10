import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createReviewController, listProviderReviewsController } from './review.controller';
import { createReviewSchema } from './review.validation';

const router = Router();

router.get('/providers/:providerId', listProviderReviewsController);
router.post('/', authenticate, authorizeRoles('CUSTOMER'), validateRequest({ body: createReviewSchema }), createReviewController);

export default router;
