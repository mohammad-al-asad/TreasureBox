import { Router } from 'express';
import { claimController } from './claim.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { submitClaimBodySchema, verifyClaimBodySchema } from './claim.validation';

const router = Router();

// Action-Oriented Claim Endpoints
router.post(
  '/submit-treasure-claim',
  validateRequest({ body: submitClaimBodySchema }),
  claimController.submitClaim
);

router.get('/get-all-claims-register', claimController.getAllClaims);

router.patch(
  '/verify-or-reject-claim',
  validateRequest({ body: verifyClaimBodySchema }),
  claimController.verifyOrRejectClaim
);

export default router;
