import { Router } from 'express';
import { claimController } from './claim.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import { submitClaimBodySchema, verifyClaimBodySchema } from './claim.validation';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Action-Oriented Claim Endpoints
router.post(
  '/submit-treasure-claim',
  authenticate, validateRequest({ body: submitClaimBodySchema }),
  claimController.submitClaim
);

router.get('/get-all-claims-register', authenticate, authorizeAdmin, claimController.getAllClaims);

router.patch(
  '/verify-or-reject-claim',
  authenticate, authorizeAdmin, validateRequest({ body: verifyClaimBodySchema }),
  claimController.verifyOrRejectClaim
);

export default router;
