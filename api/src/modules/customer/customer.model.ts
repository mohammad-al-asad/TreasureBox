import { Schema, model, Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  addresses: Array<{
    label: string;
    addressLine: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number];
    };
  }>;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, unique: true, sparse: true, trim: true },
    avatar: { type: String, default: '' },
    addresses: { type: [addressSchema], default: [] },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Customer = model<ICustomer>('Customer', customerSchema);

export type CustomerId = Types.ObjectId;
