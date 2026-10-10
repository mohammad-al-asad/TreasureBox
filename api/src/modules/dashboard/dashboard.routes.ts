import { Router } from 'express';
import { dashboardController } from './dashboard.controller';

const router = Router();

// Action-Oriented Dashboard Metrics Endpoint
router.get('/get-overview-metrics', dashboardController.getOverviewMetrics);

export default router;
