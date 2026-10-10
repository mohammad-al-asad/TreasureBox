import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { confirmRequestController, createRequestController, listRequestsController, updateRequestStatusController } from './request.controller';
import { createRequestSchema, customerConfirmRequestSchema, updateRequestStatusSchema } from './request.validation';

const router = Router();

router.get('/', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER', 'ADMIN'), listRequestsController);
router.post('/', authenticate, authorizeRoles('CUSTOMER'), validateRequest({ body: createRequestSchema }), createRequestController);
router.post('/:requestId/confirm', authenticate, authorizeRoles('CUSTOMER'), validateRequest({ body: customerConfirmRequestSchema }), confirmRequestController);
router.patch('/:requestId/status', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER', 'ADMIN'), validateRequest({ body: updateRequestStatusSchema }), updateRequestStatusController);

export default router;
