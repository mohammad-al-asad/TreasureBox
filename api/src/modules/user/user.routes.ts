import { Router } from 'express';
import { userController } from './user.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  getAllUsersQuerySchema,
  userIdParamsSchema,
  resetUserAccessBodySchema,
} from './user.validation';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Action-Oriented Hunter Management Routes
router.get(
  '/get-all-users',
  authenticate, authorizeAdmin, validateRequest({ query: getAllUsersQuerySchema }),
  userController.getAllUsers
);

router.patch(
  '/toggle-user-status/:id',
  authenticate, authorizeAdmin, validateRequest({ params: userIdParamsSchema }),
  userController.toggleUserStatus
);

router.post(
  '/reset-user-access',
  authenticate, authorizeAdmin, validateRequest({ body: resetUserAccessBodySchema }),
  userController.resetUserAccess
);

router.delete(
  '/revoke-user-record/:id',
  authenticate, authorizeAdmin, validateRequest({ params: userIdParamsSchema }),
  userController.revokeUserRecord
);

export default router;
