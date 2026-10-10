import { Router } from 'express';
import { settingsController } from './settings.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  updateLegalDocBodySchema,
  getLegalDocParamsSchema,
} from './settings.validation';

const router = Router();

// Action-Oriented Legal Settings Endpoints
router.get(
  '/get-legal-document/:type',
  validateRequest({ params: getLegalDocParamsSchema }),
  settingsController.getLegalDocument
);

router.put(
  '/update-legal-document',
  validateRequest({ body: updateLegalDocBodySchema }),
  settingsController.updateLegalDocument
);

// Action-Oriented Contact & Social Channel Endpoints
router.get('/get-contact-settings', settingsController.getContactSettings);
router.post('/update-contact-settings', settingsController.updateContactSettings);
router.put('/update-contact-settings', settingsController.updateContactSettings);

export default router;
