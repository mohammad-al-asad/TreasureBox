import { Schema, model, Document, Types } from 'mongoose';

export interface IService extends Document {
  provider: Types.ObjectId;
  category: Types.ObjectId;
  title: string;
  description: string;
  basePrice: number;
  priceUnit: 'FIXED' | 'HOURLY' | 'DAILY';
  durationMinutes: number;
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 2500 },
    basePrice: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, enum: ['FIXED', 'HOURLY', 'DAILY'], default: 'FIXED' },
    durationMinutes: { type: Number, required: true, min: 15, max: 1440 },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ provider: 1, isActive: 1 });
serviceSchema.index({ category: 1, isActive: 1 });
serviceSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Service = model<IService>('Service', serviceSchema);
