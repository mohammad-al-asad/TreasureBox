import { firebaseMessaging } from '../../config/firebase';
import { AppError } from '../../utils/response';
import { MessageLog } from './notification.model';

export const sendPushNotification = async (token: string, title: string, body: string): Promise<string> => {
  if (!firebaseMessaging) {
    await MessageLog.create({ recipientPushToken: token, title, body, channel: 'PUSH', deliveryStatus: 'FAILED', errorMessage: 'Firebase push notification configuration is incomplete' });
    throw new AppError(503, 'Firebase push notification configuration is incomplete', 'PUSH_PROVIDER_NOT_CONFIGURED');
  }

  try {
    const messageId = await firebaseMessaging.send({
      token,
      notification: { title, body },
    });

    await MessageLog.create({ recipientPushToken: token, title, body, channel: 'PUSH', providerMessageId: messageId, deliveryStatus: 'SENT' });

    return messageId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Firebase push delivery failure';
    await MessageLog.create({ recipientPushToken: token, title, body, channel: 'PUSH', deliveryStatus: 'FAILED', errorMessage });
    throw new AppError(502, `Firebase push delivery failed: ${errorMessage}`, 'PUSH_DELIVERY_FAILED');
  }
};
