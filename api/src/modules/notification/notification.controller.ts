import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { createNotification, getAllNotifications, listMessageLogs, listMyNotifications, markNotificationRead } from './notification.service';

const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1, { message: 'page must be a positive integer' })),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100, { message: 'limit must be between 1 and 100' })),
});

export const createNotificationController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const notification = await createNotification(req.body);
  res.status(201).json(sendSuccess('Notification created successfully', notification));
});

export const getAllNotificationsController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsed = paginationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
      errorType: 'VALIDATION_ERROR',
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { page, limit } = parsed.data;
  const result = await getAllNotifications(page, limit);
  res.status(200).json(sendSuccess('All notifications retrieved successfully', result));
});

export const listMyNotificationsController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const notifications = await listMyNotifications(req.auth!.accountId, req.auth!.role);
  res.status(200).json(sendSuccess('Notifications fetched successfully', notifications));
});

export const markNotificationReadController = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const notification = await markNotificationRead(req.params.notificationId, req.auth!.accountId);
  res.status(200).json(sendSuccess('Notification marked as read successfully', notification));
});

export const listMessageLogsController = asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  const logs = await listMessageLogs();
  res.status(200).json(sendSuccess('Notification message logs fetched successfully', logs));
});
