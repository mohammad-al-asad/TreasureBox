import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  accountId: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN' | 'CUSTOMER' | 'PROVIDER';
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
