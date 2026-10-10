import { Schema, model, Document, Types } from 'mongoose';

export interface IServiceRequest extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  category: Types.ObjectId;
  service?: Types.ObjectId;
  title: string;
  description: string;
  preferredDate: Date;
  address: string;
  customerConfirmedAt?: Date;
  providerRespondedAt?: Date;
  budgetMin?: number;
  budgetMax?: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EN_ROUTE' | 'ARRIVED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  statusHistory: Array<{
    status: string;
    changedBy: Types.ObjectId;
    changedByRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
    note?: string;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IServiceRequest>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2500 },
    preferredDate: { type: Date, required: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    customerConfirmedAt: { type: Date },
    providerRespondedAt: { type: Date },
    budgetMin: { type: Number, min: 0 },
    budgetMax: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELED', 'NO_SHOW'],
      default: 'PENDING',
    },
    statusHistory: {
      type: [
        {
          status: { type: String, required: true },
          changedBy: { type: Schema.Types.ObjectId, required: true },
          changedByRole: { type: String, enum: ['CUSTOMER', 'PROVIDER', 'ADMIN'], required: true },
          note: { type: String, trim: true, maxlength: 500 },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

requestSchema.index({ customer: 1, status: 1 });
requestSchema.index({ provider: 1, status: 1 });
requestSchema.index({ category: 1, status: 1 });

export const ServiceRequest = model<IServiceRequest>('ServiceRequest', requestSchema);
