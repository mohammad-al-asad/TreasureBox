import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Action-Oriented Dashboard Metrics Endpoint
router.get('/get-overview-metrics', authenticate, authorizeAdmin, dashboardController.getOverviewMetrics);

export default router;
