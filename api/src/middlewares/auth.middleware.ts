import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/response";
import { Customer, ICustomer } from "../modules/customer/customer.model";
import { Admin, IAdmin } from "../modules/admin/admin.model";
import { User } from "../modules/user/user.model";
import { IUserDocument } from "../modules/user/user.interface";

export type AuthRole =
  | "USER"
  | "ADMIN"
  | "SUPERADMIN"
  | "CUSTOMER"
  | "PROVIDER";
export type AuthAccount = IUserDocument | IAdmin | ICustomer;

export interface AuthenticatedRequest extends Request {
  account?: AuthAccount;
  auth?: {
    accountId: string;
    role: AuthRole;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(
        new AppError(
          401,
          "Bearer access token is required",
          "AUTHENTICATION_ERROR",
        ),
      );
      return;
    }

    const payload = verifyAccessToken(authHeader.split(" ")[1]);
    const account =
      payload.role === "USER"
        ? (await User.findById(payload.accountId)) ||
          (await Customer.findById(payload.accountId))
        : await Admin.findById(payload.accountId);

    if (!account) {
      next(
        new AppError(
          401,
          "Account associated with this token was not found",
          "AUTHENTICATION_ERROR",
        ),
      );
      return;
    }

    req.account = account;
    req.auth = payload;
    next();
  } catch (_error) {
    next(
      new AppError(
        401,
        "Invalid or expired access token",
        "AUTHENTICATION_ERROR",
      ),
    );
  }
};

export const authorizeRoles = (...roles: AuthRole[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(
        new AppError(
          403,
          `Access denied. Requires one of roles: ${roles.join(", ")}`,
          "AUTHORIZATION_ERROR",
        ),
      );
      return;
    }
    next();
  };
};

export const authorizeAdmin = authorizeRoles("ADMIN", "SUPERADMIN");
export const authorizeSuperAdmin = authorizeRoles("SUPERADMIN");
export const authorizeUser = authorizeRoles("USER");
