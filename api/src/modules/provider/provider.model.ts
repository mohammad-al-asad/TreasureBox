import { Schema, model, Document, Types } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  email: string;
  password?: string;
  phone: string;
  avatar?: string;
  businessName: string;
  bio?: string;
  city: string;
  address?: string;
  skills: string[];
  businessHours: Array<{
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  serviceRadiusKm: number;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  availabilityStatus: 'ONLINE' | 'OFFLINE' | 'BUSY';
  ratingAverage: number;
  ratingCount: number;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

const providerSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: '' },
    businessName: { type: String, required: true, trim: true, maxlength: 140 },
    bio: { type: String, trim: true, maxlength: 1200 },
    city: { type: String, required: true, trim: true, maxlength: 120, default: 'Unknown' },
    address: { type: String, trim: true, maxlength: 500 },
    skills: { type: [String], default: [] },
    businessHours: {
      type: [
        {
          weekday: { type: Number, required: true, min: 0, max: 6 },
          openTime: { type: String, required: true, trim: true },
          closeTime: { type: String, required: true, trim: true },
          isClosed: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    serviceRadiusKm: { type: Number, default: 25, min: 1, max: 250 },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    availabilityStatus: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'BUSY'],
      default: 'OFFLINE',
    },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

providerSchema.index({ location: '2dsphere' });
providerSchema.index({ verificationStatus: 1, availabilityStatus: 1 });
providerSchema.index({ city: 1, verificationStatus: 1, availabilityStatus: 1 });

export const Provider = model<IProvider>('Provider', providerSchema);

export type ProviderId = Types.ObjectId;
