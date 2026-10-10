import { Router } from 'express';
import { userController } from './user.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  getAllUsersQuerySchema,
  userIdParamsSchema,
  resetUserAccessBodySchema,
} from './user.validation';

const router = Router();

// Action-Oriented Hunter Management Routes
router.get(
  '/get-all-users',
  validateRequest({ query: getAllUsersQuerySchema }),
  userController.getAllUsers
);

router.patch(
  '/toggle-user-status/:id',
  validateRequest({ params: userIdParamsSchema }),
  userController.toggleUserStatus
);

router.post(
  '/reset-user-access',
  validateRequest({ body: resetUserAccessBodySchema }),
  userController.resetUserAccess
);

router.delete(
  '/revoke-user-record/:id',
  validateRequest({ params: userIdParamsSchema }),
  userController.revokeUserRecord
);

export default router;
