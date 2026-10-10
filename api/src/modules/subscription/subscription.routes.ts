import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  createSubscriptionController,
  listAllSubscriptionsController,
  listMySubscriptionsController,
  listSubscriptionPlansController,
  upsertSubscriptionPlanController,
} from './subscription.controller';
import { createSubscriptionSchema, upsertSubscriptionPlanSchema } from './subscription.validation';

const router = Router();

router.get('/admin', authenticate, authorizeAdmin, listAllSubscriptionsController);
router.get('/plans', listSubscriptionPlansController);
router.put('/plans', authenticate, authorizeAdmin, validateRequest({ body: upsertSubscriptionPlanSchema }), upsertSubscriptionPlanController);
router.get('/me', authenticate, authorizeRoles('PROVIDER'), listMySubscriptionsController);
router.post('/', authenticate, authorizeRoles('PROVIDER'), validateRequest({ body: createSubscriptionSchema }), createSubscriptionController);

export default router;
