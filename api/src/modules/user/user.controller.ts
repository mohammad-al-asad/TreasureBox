import { Request, Response } from 'express';
import { userService } from './user.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export class UserController {
  public getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const result = await userService.getAllUsers({ search, status });
    res.status(200).json(sendSuccess('Hunter user records retrieved successfully', result));
  });

  public toggleUserStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.toggleUserStatus(req.params.id);
    res.status(200).json(sendSuccess(`User status changed to ${result.status} successfully`, result));
  });

  public resetUserAccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.resetUserAccess(req.body.email);
    res.status(200).json(sendSuccess(result.message, result));
  });

  public revokeUserRecord = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.revokeUserRecord(req.params.id);
    res.status(200).json(sendSuccess(result.message, result));
  });
}

export const userController = new UserController();
