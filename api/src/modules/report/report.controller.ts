import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createReport, listReports, updateReportStatus } from './report.service';

export const createReportController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const report = await createReport(req.auth!.accountId, req.auth!.role as 'CUSTOMER' | 'PROVIDER', req.body);
  res.status(201).json(sendSuccess('Report submitted successfully', report));
});

export const listReportsController = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const reports = await listReports();
  res.status(200).json(sendSuccess('Reports fetched successfully', reports));
});

export const updateReportController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const report = await updateReportStatus(req.params.reportId, req.body);
  res.status(200).json(sendSuccess('Report status updated successfully', report));
});
