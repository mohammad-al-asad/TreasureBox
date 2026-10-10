import { Schema, model, Document, Types } from 'mongoose';

export type PaymentMethod = 'PAYPAL' | 'APPLE_PAY' | 'IN_APP_CHECKOUT' | 'FREE_PERMIT' | 'CARD' | 'STRIPE';

export interface IPayment extends Document {
  huntId: Types.ObjectId;
  hunterName: string;
  hunterEmail: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paypalOrderId: string;
  paypalCaptureId?: string;
  status: 'CREATED' | 'COMPLETED' | 'FAILED';
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    huntId: { type: Schema.Types.ObjectId, ref: 'Hunt', required: true, index: true },
    hunterName: { type: String, required: true, trim: true },
    hunterEmail: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'KWD', uppercase: true },
    paymentMethod: {
      type: String,
      enum: ['PAYPAL', 'APPLE_PAY', 'IN_APP_CHECKOUT', 'FREE_PERMIT', 'CARD', 'STRIPE'],
      default: 'IN_APP_CHECKOUT',
      required: true,
    },
    paypalOrderId: { type: String, required: true, unique: true, index: true },
    paypalCaptureId: { type: String, default: null },
    status: {
      type: String,
      enum: ['CREATED', 'COMPLETED', 'FAILED'],
      default: 'CREATED',
      index: true,
    },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ hunterEmail: 1, createdAt: -1 });

export const Payment = model<IPayment>('Payment', paymentSchema);
