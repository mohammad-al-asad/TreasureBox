import { Request, Response } from 'express';
import { z } from 'zod';
import { huntService } from './hunt.service';
import { sendSuccess, AppError } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 5))
    .pipe(z.number().int().min(1).max(20)),
});

export class HuntController {
  public uploadMediaFile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new AppError(400, 'No file was provided for upload', 'FILE_REQUIRED');
    }
    const relativePath = `uploads/images/${req.file.filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;

    res.status(201).json(
      sendSuccess('Media file uploaded successfully', {
        filePath: relativePath,
        url: fullUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      })
    );
  });
  public createHunt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await huntService.createHunt(req.body);
    res.status(201).json(sendSuccess('Expedition created successfully', result));
  });

  public getAllLiveHunts = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await huntService.getAllLiveHunts();
    res.status(200).json(sendSuccess('Live expeditions retrieved successfully', result));
  });

  public getMyPurchasedExpeditions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authEmail = (req as unknown as { account?: { email?: string } }).account?.email;
    const email = (authEmail || (req.query.email as string) || '').trim();

    if (!email) {
      res.status(200).json(sendSuccess('No user email provided', { data: [], total: 0, page: 1, totalPages: 1, limit: 5 }));
      return;
    }

    const parsed = paginationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        errorType: 'VALIDATION_ERROR',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit } = parsed.data;
    const result = await huntService.getMyPurchasedExpeditions(email, page, limit);
    res.status(200).json(sendSuccess('Purchased expeditions retrieved successfully', result));
  });


  public getHuntDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await huntService.getHuntDetailsForHunter(req.params.id);
    res.status(200).json(sendSuccess('Expedition field brief retrieved successfully', result));
  });

  public verifyCipherSolution = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { huntId, sequence, hunterEmail } = req.body;
    const email = hunterEmail || (req as any).user?.email;
    const result = await huntService.verifyCipherSolution(huntId, sequence, email);
    if (result.solved) {
      res.status(200).json(sendSuccess('Cipher solved successfully! Stage two unlocked.', result));
    } else if (result.locked) {
      res.status(200).json(sendSuccess('Puzzle locked! 3 attempts reached. Please purchase again.', result));
    } else {
      res.status(200).json(sendSuccess(result.message || 'Incorrect cipher sequence. Keep searching the ruins.', result));
    }
  });

  public getAllCabinetHunts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filterStatus = req.query.status as string | undefined;
    const result = await huntService.getAllCabinetHunts(filterStatus);
    res.status(200).json(sendSuccess('Cabinet expeditions retrieved successfully', result));
  });

  public getCabinetHuntById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await huntService.getCabinetHuntById(req.params.id);
    res.status(200).json(sendSuccess('Cabinet expedition retrieved successfully', result));
  });

  public updateHuntDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await huntService.updateHuntDetails(req.params.id, req.body);
    res.status(200).json(sendSuccess('Expedition updated successfully', result));
  });

  public deleteHunt = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await huntService.deleteHunt(req.params.id);
    res.status(200).json(sendSuccess('Expedition deleted successfully', result));
  });
}

export const huntController = new HuntController();
