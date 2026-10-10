import { NextFunction, Response } from 'express';
import { AuthenticatedRequest, AuthRole } from './auth.middleware';
import { AppError } from '../utils/response';

export const authorizeRoles = (...roles: AuthRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError(401, 'Authenticated account context is missing', 'AUTHENTICATION_ERROR'));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, `Access denied. Required role: ${roles.join(' or ')}`, 'AUTHORIZATION_ERROR'));
      return;
    }

    next();
  };
};
