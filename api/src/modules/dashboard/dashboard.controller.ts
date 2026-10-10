import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export class DashboardController {
  public getOverviewMetrics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await dashboardService.getOverviewMetrics();
    res.status(200).json(sendSuccess('Dashboard metrics retrieved successfully', result));
  });
}

export const dashboardController = new DashboardController();
