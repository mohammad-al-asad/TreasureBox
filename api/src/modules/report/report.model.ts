import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reporterRole: 'CUSTOMER' | 'PROVIDER';
  target: Types.ObjectId;
  targetRole: 'CUSTOMER' | 'PROVIDER';
  reason: string;
  details?: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, required: true },
    reporterRole: { type: String, enum: ['CUSTOMER', 'PROVIDER'], required: true },
    target: { type: Schema.Types.ObjectId, required: true },
    targetRole: { type: String, enum: ['CUSTOMER', 'PROVIDER'], required: true },
    reason: { type: String, required: true, trim: true, maxlength: 160 },
    details: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1, reporterRole: 1 });

export const Report = model<IReport>('Report', reportSchema);
