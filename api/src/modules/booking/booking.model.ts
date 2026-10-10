import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: Types.ObjectId;
  scheduledAt: Date;
  address: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'AUTHORIZED' | 'PAID' | 'REFUNDED' | 'FAILED';
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    scheduledAt: { type: Date, required: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'AUTHORIZED', 'PAID', 'REFUNDED', 'FAILED'],
      default: 'UNPAID',
    },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, scheduledAt: -1 });
bookingSchema.index({ provider: 1, scheduledAt: -1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

export const Booking = model<IBooking>('Booking', bookingSchema);
