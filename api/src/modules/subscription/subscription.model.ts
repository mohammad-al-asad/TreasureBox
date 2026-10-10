import { Schema, model, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  provider: Types.ObjectId;
  planName: string;
  planType: 'PAY_AS_YOU_GO' | 'MONTHLY' | 'ANNUAL';
  stripeSubscriptionId?: string;
  price: number;
  currency: string;
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPlan extends Document {
  name: string;
  planType: 'PAY_AS_YOU_GO' | 'MONTHLY' | 'ANNUAL';
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    planName: { type: String, required: true, trim: true },
    planType: { type: String, enum: ['PAY_AS_YOU_GO', 'MONTHLY', 'ANNUAL'], required: true },
    stripeSubscriptionId: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true }
);

subscriptionSchema.index({ provider: 1, status: 1 });
subscriptionSchema.index({ planType: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    planType: { type: String, enum: ['PAY_AS_YOU_GO', 'MONTHLY', 'ANNUAL'], required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subscriptionPlanSchema.index({ planType: 1, isActive: 1 });

export const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', subscriptionPlanSchema);
