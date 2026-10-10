import { Schema, model } from 'mongoose';
import { IUserDocument } from './user.interface';

const recentHuntRecordSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['In Progress', 'Solved', 'Abandoned'],
      default: 'In Progress',
    },
    date: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    avatar: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    },
    phone: { type: String, trim: true },
    boughtCount: { type: Number, default: 0 },
    solvedCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ['USER', 'ADMIN', 'SUPERADMIN'],
      default: 'USER',
      index: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Suspended'],
      default: 'Active',
      index: true,
    },
    joinedDate: { type: String, default: () => new Date().toLocaleDateString('en-GB') },
    recentHunts: { type: [recentHuntRecordSchema], default: [] },
  },
  { timestamps: true }
);

export const User = model<IUserDocument>('User', userSchema);
