import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { getMyCustomerProfile, updateMyCustomerProfile } from './customer.controller';
import { updateCustomerSchema } from './customer.validation';

const router = Router();

router.use(authenticate, authorizeRoles('CUSTOMER'));
router.get('/me', getMyCustomerProfile);
router.patch('/me', validateRequest({ body: updateCustomerSchema }), updateMyCustomerProfile);

export default router;
