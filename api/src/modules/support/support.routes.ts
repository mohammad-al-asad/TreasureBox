import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createSupportTicketController, listSupportTicketsController, updateSupportTicketController } from './support.controller';
import { createSupportTicketSchema, updateSupportTicketSchema } from './support.validation';

const router = Router();

router.get('/', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER', 'ADMIN'), listSupportTicketsController);
router.post('/', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER'), validateRequest({ body: createSupportTicketSchema }), createSupportTicketController);
router.patch('/:ticketId', authenticate, authorizeAdmin, validateRequest({ body: updateSupportTicketSchema }), updateSupportTicketController);

export default router;
