import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createServiceController, listServicesController, updateServiceController } from './service.controller';
import { createServiceSchema, updateServiceSchema } from './service.validation';

const router = Router();

router.get('/', listServicesController);
router.post('/', authenticate, authorizeRoles('PROVIDER'), validateRequest({ body: createServiceSchema }), createServiceController);
router.patch('/:serviceId', authenticate, authorizeRoles('PROVIDER'), validateRequest({ body: updateServiceSchema }), updateServiceController);

export default router;
