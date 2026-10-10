import { z } from 'zod';
import { MessageLog, Notification } from './notification.model';
import { createNotificationSchema } from './notification.validation';

type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export interface PaginatedNotificationsResult {
  data: unknown[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export const createNotification = async (input: CreateNotificationInput) => {
  return Notification.create(input);
};

export const listMyNotifications = async (
  accountId: string,
  role: 'USER' | 'ADMIN' | 'SUPERADMIN' | 'CUSTOMER' | 'PROVIDER' | string
) => {
  return Notification.find({ recipient: accountId, recipientRole: role }).sort({ createdAt: -1 }).limit(100).lean();
};

export const markNotificationRead = async (notificationId: string, accountId: string) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: accountId },
    { readAt: new Date() },
    { returnDocument: 'after', runValidators: true }
  );
};

export const listMessageLogs = async () => {
  return MessageLog.find().sort({ createdAt: -1 }).limit(300).lean();
};

export const getAllNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedNotificationsResult> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const skip = (safePage - 1) * safeLimit;

  const [data, total] = await Promise.all([
    Notification.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(),
  ]);

  return {
    data,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
    limit: safeLimit,
  };
};
