import { Schema, model, Document } from 'mongoose';

export interface IOtpDocument extends Document {
  email: string;
  otp: string;
  purpose: 'REGISTRATION' | 'PASSWORD_RESET';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOtpDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    otp: { type: String, required: true, trim: true },
    purpose: {
      type: String,
      enum: ['REGISTRATION', 'PASSWORD_RESET'],
      default: 'REGISTRATION',
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL automatic cleanup
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Otp = model<IOtpDocument>('Otp', otpSchema);
