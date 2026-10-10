import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createBookingController, listMyBookingsController, updateBookingStatusController } from './booking.controller';
import { createBookingSchema, updateBookingStatusSchema } from './booking.validation';

const router = Router();

router.get('/me', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER'), listMyBookingsController);
router.post('/', authenticate, authorizeRoles('CUSTOMER'), validateRequest({ body: createBookingSchema }), createBookingController);
router.patch('/:bookingId/status', authenticate, authorizeRoles('PROVIDER', 'ADMIN'), validateRequest({ body: updateBookingStatusSchema }), updateBookingStatusController);

export default router;
