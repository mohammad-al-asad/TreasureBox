import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  recipientRole: 'USER' | 'ADMIN' | 'SUPERADMIN' | 'CUSTOMER' | 'PROVIDER';
  title: string;
  body: string;
  channel: 'IN_APP' | 'SMS' | 'PUSH';
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  readAt?: Date;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageLog extends Document {
  recipientPhone?: string;
  recipientPushToken?: string;
  channel: 'SMS' | 'PUSH';
  providerMessageId?: string;
  title?: string;
  body: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ['USER', 'ADMIN', 'SUPERADMIN', 'CUSTOMER', 'PROVIDER'], required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    channel: { type: String, enum: ['IN_APP', 'SMS', 'PUSH'], default: 'IN_APP' },
    deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    readAt: { type: Date },
    metadata: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, recipientRole: 1, createdAt: -1 });
notificationSchema.index({ deliveryStatus: 1, channel: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);

const messageLogSchema = new Schema<IMessageLog>(
  {
    recipientPhone: { type: String, trim: true },
    recipientPushToken: { type: String, trim: true },
    channel: { type: String, enum: ['SMS', 'PUSH'], required: true },
    providerMessageId: { type: String, trim: true },
    title: { type: String, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    errorMessage: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

messageLogSchema.index({ channel: 1, deliveryStatus: 1, createdAt: -1 });

export const MessageLog = model<IMessageLog>('MessageLog', messageLogSchema);
