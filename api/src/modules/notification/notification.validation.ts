import { z } from 'zod';

export const createNotificationSchema = z.object({
  recipient: z.string().trim().min(1),
  recipientRole: z.enum(['USER', 'ADMIN', 'SUPERADMIN', 'CUSTOMER', 'PROVIDER']),
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(1000),
  channel: z.enum(['IN_APP', 'SMS', 'PUSH']).default('IN_APP'),
  metadata: z.record(z.string()).default({}),
});
