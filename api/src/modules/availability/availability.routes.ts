import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createMyAvailability, listMyAvailability } from './availability.controller';
import { upsertAvailabilitySchema } from './availability.validation';

const router = Router();

router.use(authenticate, authorizeRoles('PROVIDER'));
router.get('/me', listMyAvailability);
router.post('/me', validateRequest({ body: upsertAvailabilitySchema }), createMyAvailability);

export default router;
