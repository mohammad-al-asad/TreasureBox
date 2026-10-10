import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizeSuperAdmin } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  dashboardController,
  listAdminCustomersController,
  listAdminPaymentsController,
  listAdminProvidersController,
  listAdminRequestsController,
  listAdminReviewsController,
  moderateReviewController,
  verifyProviderController,
  getAllAdminsController,
  createNewAdminController,
  toggleAdminStatusController,
  deleteAdminController,
} from './admin.controller';
import { moderateReviewSchema, verifyProviderSchema, createAdminSchema } from './admin.validation';

const router = Router();

// Command Operator Management (SUPERADMIN Only for mutations)
router.get('/get-all-admins', authenticate, authorizeAdmin, getAllAdminsController);
router.post(
  '/create-new-admin',
  authenticate,
  authorizeSuperAdmin,
  validateRequest({ body: createAdminSchema }),
  createNewAdminController
);
router.patch('/toggle-admin-status/:id', authenticate, authorizeSuperAdmin, toggleAdminStatusController);
router.delete('/delete-admin/:id', authenticate, authorizeSuperAdmin, deleteAdminController);

router.use(authenticate, authorizeAdmin);
router.get('/dashboard', dashboardController);
router.get('/customers', listAdminCustomersController);
router.get('/providers', listAdminProvidersController);
router.get('/requests', listAdminRequestsController);
router.get('/payments', listAdminPaymentsController);
router.get('/reviews', listAdminReviewsController);
router.patch('/providers/:providerId/verification', validateRequest({ body: verifyProviderSchema }), verifyProviderController);
router.patch('/reviews/:reviewId/moderation', validateRequest({ body: moderateReviewSchema }), moderateReviewController);

export default router;
