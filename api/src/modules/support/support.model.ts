import { Schema, model, Document, Types } from 'mongoose';

export interface ISupportTicket extends Document {
  requester: Types.ObjectId;
  requesterRole: 'CUSTOMER' | 'PROVIDER';
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    requester: { type: Schema.Types.ObjectId, required: true },
    requesterRole: { type: String, enum: ['CUSTOMER', 'PROVIDER'], required: true },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN' },
    adminNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

supportTicketSchema.index({ requester: 1, requesterRole: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export const SupportTicket = model<ISupportTicket>('SupportTicket', supportTicketSchema);
