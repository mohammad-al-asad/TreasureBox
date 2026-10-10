import { twilioClient } from '../../config/twilio';
import { env } from '../../config/env';
import { AppError } from '../../utils/response';
import { MessageLog } from './notification.model';

export const sendSms = async (to: string, body: string): Promise<string> => {
  if (!twilioClient || !env.TWILIO_FROM_PHONE) {
    await MessageLog.create({ recipientPhone: to, body, channel: 'SMS', deliveryStatus: 'FAILED', errorMessage: 'Twilio SMS configuration is incomplete' });
    throw new AppError(503, 'Twilio SMS configuration is incomplete', 'SMS_PROVIDER_NOT_CONFIGURED');
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      body,
      from: env.TWILIO_FROM_PHONE,
    });

    await MessageLog.create({ recipientPhone: to, body, channel: 'SMS', providerMessageId: message.sid, deliveryStatus: 'SENT' });

    return message.sid;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Twilio delivery failure';
    await MessageLog.create({ recipientPhone: to, body, channel: 'SMS', deliveryStatus: 'FAILED', errorMessage });
    throw new AppError(502, `Twilio SMS delivery failed: ${errorMessage}`, 'SMS_DELIVERY_FAILED');
  }
};
