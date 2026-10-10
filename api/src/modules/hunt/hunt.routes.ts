import { Router } from 'express';
import { huntController } from './hunt.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { uploadHuntMedia } from '../../middlewares/upload.middleware';
import {
  createHuntSchema,
  updateHuntSchema,
  verifyCipherSolutionSchema,
  getHuntByIdSchema,
} from './hunt.validation';

const router = Router();

// Media Upload Endpoint (Stores to /uploads/images/ and returns relative path)
router.post('/upload-media-file', uploadHuntMedia.single('file'), huntController.uploadMediaFile);

// Action-Oriented Hunter Endpoints (Mobile App)
router.get('/get-all-live-hunts', huntController.getAllLiveHunts);
router.get('/get-my-purchased-expeditions', huntController.getMyPurchasedExpeditions);
router.get(
  '/get-hunt-details/:id',
  validateRequest({ params: getHuntByIdSchema }),
  huntController.getHuntDetails
);
router.post(
  '/verify-cipher-solution',
  validateRequest({ body: verifyCipherSolutionSchema }),
  huntController.verifyCipherSolution
);

// Action-Oriented Dashboard / Operator Endpoints
router.get('/get-all-cabinet-hunts', huntController.getAllCabinetHunts);
router.get(
  '/get-cabinet-hunt-by-id/:id',
  validateRequest({ params: getHuntByIdSchema }),
  huntController.getCabinetHuntById
);
router.post(
  '/create-new-hunt',
  validateRequest({ body: createHuntSchema }),
  huntController.createHunt
);
router.put(
  '/update-hunt-details/:id',
  validateRequest({ params: getHuntByIdSchema, body: updateHuntSchema }),
  huntController.updateHuntDetails
);
router.delete(
  '/delete-hunt/:id',
  validateRequest({ params: getHuntByIdSchema }),
  huntController.deleteHunt
);

export default router;
