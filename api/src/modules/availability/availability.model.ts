import { Schema, model, Document, Types } from 'mongoose';

export interface IAvailability extends Document {
  provider: Types.ObjectId;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const availabilitySchema = new Schema<IAvailability>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    weekday: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, default: 'UTC' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

availabilitySchema.index({ provider: 1, weekday: 1, isActive: 1 });

export const Availability = model<IAvailability>('Availability', availabilitySchema);
