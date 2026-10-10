import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  name: string;
  email: string;
  avatar?: string;
  password?: string;
  role: 'ADMIN' | 'SUPERADMIN';
  permissions: string[];
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, default: '' },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['ADMIN', 'SUPERADMIN'], default: 'ADMIN', index: true },
    permissions: { type: [String], default: ['*'] },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Admin = model<IAdmin>('Admin', adminSchema);
