import { Document, Types } from 'mongoose';

export type UserStatus = 'Active' | 'Suspended';

export interface IRecentHuntRecord {
  title: string;
  status: 'In Progress' | 'Solved' | 'Abandoned';
  date: string;
  amount: number;
}

export interface IUser {
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  password?: string;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  boughtCount: number;
  solvedCount: number;
  revenue: number;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
  status: UserStatus;
  joinedDate: string;
  recentHunts: IRecentHuntRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}
