import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { LegalDocType } from './settings.interface';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

export class SettingsController {
  public getLegalDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const type = req.params.type.toUpperCase() as LegalDocType;
    const result = await settingsService.getLegalDocument(type);
    res.status(200).json(sendSuccess('Legal document retrieved successfully', result));
  });

  public updateLegalDocument = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { type, title, content } = req.body;
    const resolvedTitle =
      title ||
      (type === 'TERMS'
        ? 'Terms & Conditions'
        : type === 'PRIVACY'
        ? 'Privacy Policy'
        : 'About Us');
    const result = await settingsService.updateLegalDocument(type, resolvedTitle, content);
    res.status(200).json(sendSuccess('Legal document updated successfully', result));
  });

  public getContactSettings = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await settingsService.getContactSettings();
    res.status(200).json(sendSuccess('Contact and social channel settings retrieved successfully', result));
  });

  public updateContactSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await settingsService.updateContactSettings(req.body);
    res.status(200).json(sendSuccess('Contact and social channel settings updated successfully', result));
  });
}

export const settingsController = new SettingsController();
