import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { geoSearchQuerySchema } from '../common.validation';
import { getMyProviderDashboard, getMyProviderProfile, getProvider, listProviders, updateMyProviderProfile } from './provider.controller';
import { updateProviderSchema } from './provider.validation';

const router = Router();

router.get('/me/profile', authenticate, authorizeRoles('PROVIDER'), getMyProviderProfile);
router.patch('/me/profile', authenticate, authorizeRoles('PROVIDER'), validateRequest({ body: updateProviderSchema }), updateMyProviderProfile);
router.get('/me/dashboard', authenticate, authorizeRoles('PROVIDER'), getMyProviderDashboard);
router.get('/', validateRequest({ query: geoSearchQuerySchema }), listProviders);
router.get('/:providerId', getProvider);

export default router;
