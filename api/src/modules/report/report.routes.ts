import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';
import { authorizeRoles } from '../../middlewares/role.middleware';
import { validateRequest } from '../../middlewares/validation.middleware';
import { createReportController, listReportsController, updateReportController } from './report.controller';
import { createReportSchema, updateReportStatusSchema } from './report.validation';

const router = Router();

router.post('/', authenticate, authorizeRoles('CUSTOMER', 'PROVIDER'), validateRequest({ body: createReportSchema }), createReportController);
router.get('/', authenticate, authorizeAdmin, listReportsController);
router.patch('/:reportId/status', authenticate, authorizeAdmin, validateRequest({ body: updateReportStatusSchema }), updateReportController);

export default router;
