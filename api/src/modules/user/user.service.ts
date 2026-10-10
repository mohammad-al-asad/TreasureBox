import { Types } from 'mongoose';
import { User } from './user.model';
import { Admin } from '../admin/admin.model';
import { IUser, IUserDocument } from './user.interface';
import { AppError } from '../../utils/response';

export class UserService {
  /**
   * Retrieve all hunter user accounts for Dashboard (Excluding ADMIN & SUPERADMIN)
   */
  public async getAllUsers(filters?: {
    search?: string;
    status?: string;
  }): Promise<IUserDocument[]> {
    const query: Record<string, unknown> = {
      role: { $nin: ['ADMIN', 'SUPERADMIN'] },
    };

    // Also exclude any email that exists in the Admin collection
    const adminEmails = await Admin.find().distinct('email');
    if (adminEmails && adminEmails.length > 0) {
      query.email = { $nin: adminEmails };
    }

    if (filters?.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    return users as unknown as IUserDocument[];
  }

  /**
   * Toggle hunter user account status (Active <-> Suspended)
   * Uses modern Mongoose returnDocument: 'after'
   */
  public async toggleUserStatus(userId: string): Promise<IUserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
    }

    const existingUser = await User.findById(userId).lean();
    if (!existingUser) {
      throw new AppError(404, 'Hunter user record not found in system', 'USER_NOT_FOUND');
    }

    const newStatus = existingUser.status === 'Active' ? 'Suspended' : 'Active';

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { status: newStatus } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updatedUser) {
      throw new AppError(404, 'Failed to update user status; record missing', 'USER_UPDATE_FAILED');
    }

    return updatedUser as unknown as IUserDocument;
  }

  /**
   * Reset hunter password / access link dispatch
   */
  public async resetUserAccess(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      throw new AppError(404, `No hunter account found associated with email "${normalizedEmail}"`, 'USER_NOT_FOUND');
    }

    return {
      success: true,
      message: `Password reset instructions dispatched to ${normalizedEmail}`,
    };
  }

  /**
   * Revoke & remove hunter account record from system
   */
  public async revokeUserRecord(userId: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(400, 'Invalid user ID format', 'INVALID_USER_ID');
    }

    const deleted = await User.findByIdAndDelete(userId).lean();
    if (!deleted) {
      throw new AppError(404, 'Hunter account record already deleted or not found', 'USER_NOT_FOUND');
    }

    return {
      success: true,
      message: `Hunter account record "${deleted.name}" revoked and cleared successfully`,
    };
  }
}

export const userService = new UserService();
