import { z } from 'zod';
import { Report } from './report.model';
import { createReportSchema, updateReportStatusSchema } from './report.validation';

type CreateReportInput = z.infer<typeof createReportSchema>;
type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;

export const createReport = async (reporterId: string, reporterRole: 'CUSTOMER' | 'PROVIDER', input: CreateReportInput) => {
  return Report.create({ ...input, reporter: reporterId, reporterRole });
};

export const listReports = async () => {
  return Report.find().sort({ createdAt: -1 }).lean();
};

export const updateReportStatus = async (reportId: string, input: UpdateReportStatusInput) => {
  return Report.findByIdAndUpdate(reportId, input, { returnDocument: 'after', runValidators: true });
};
