import { z } from 'zod';

const phoneSchema = z.string().trim().min(7, 'Phone number is too short').max(20, 'Phone number is too long');

export const customerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
  phone: phoneSchema.optional(),
});

export const providerRegisterSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(128),
  phone: phoneSchema,
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters long').max(140),
  city: z.string().trim().min(1, 'Provider city is required').max(120),
  address: z.string().trim().max(500).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});

export const adminRegisterSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  password: z.string().min(10, 'Admin password must be at least 10 characters long').max(128),
  role: z.enum(['ADMIN', 'SUPERADMIN']).default('ADMIN'),
  permissions: z.array(z.string().trim().min(1)).default(['*']),
});

export const loginSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['ADMIN', 'SUPERADMIN', 'USER']).default('USER'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  role: z.enum(['ADMIN', 'SUPERADMIN', 'USER']).default('ADMIN'),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  otp: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
  role: z.enum(['ADMIN', 'SUPERADMIN', 'USER']).default('ADMIN'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  otp: z.string().trim().length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long').max(128),
  role: z.enum(['ADMIN', 'SUPERADMIN', 'USER']).default('ADMIN'),
});

export const sendRegistrationOtpSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
});

export const verifyRegistrationOtpSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  password: z.string().min(4, 'Password must be at least 4 characters long').max(128),
  otp: z.string().trim().length(4, 'Verification code must be exactly 4 digits'),
});

export const resendRegistrationOtpSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  name: z.string().trim().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long').max(128),
});

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(60, 'Name cannot exceed 60 characters'),
  avatar: z.string().optional(),
});

