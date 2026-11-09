import { Request, Response } from 'express';
import { claimService } from './claim.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export class ClaimController {
  public submitClaim = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Login is required: record the claim against the signed-in account's email
    const email = (req as Request & { account?: { email?: string } }).account?.email;
    const result = await claimService.submitClaim({ ...req.body, hunterEmail: email || req.body.hunterEmail });
    res.status(201).json(sendSuccess('Treasure claim submitted successfully for verification', result));
  });

  public getAllClaims = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filterStatus = req.query.status as string | undefined;
    const result = await claimService.getAllClaims(filterStatus);
    res.status(200).json(sendSuccess('Claims register retrieved successfully', result));
  });

  public verifyOrRejectClaim = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { claimId, status, reviewNotes } = req.body;
    const result = await claimService.verifyOrRejectClaim(claimId, status, reviewNotes);
    res.status(200).json(sendSuccess(`Claim successfully ${status.toLowerCase()}`, result));
  });
}

export const claimController = new ClaimController();
