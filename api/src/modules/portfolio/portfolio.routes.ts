import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createPortfolioController, listPortfolioController } from './portfolio.controller';
import { createPortfolioSchema } from './portfolio.validation';

const router = Router();

router.get('/providers/:providerId', listPortfolioController);
router.post('/', authenticate, authorizeRoles('PROVIDER'), validateRequest({ body: createPortfolioSchema }), createPortfolioController);

export default router;
