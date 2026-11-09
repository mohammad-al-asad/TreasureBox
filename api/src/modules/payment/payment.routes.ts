import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  createPayPalOrderBodySchema,
  capturePayPalOrderBodySchema,
  purchaseHuntPermitBodySchema,
} from './payment.validation';
import { authenticate, authorizeAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// Action-Oriented PayPal Payment Endpoints
router.post(
  '/create-paypal-order',
  authenticate, validateRequest({ body: createPayPalOrderBodySchema }),
  paymentController.createPayPalOrder
);

router.post(
  '/capture-paypal-order',
  authenticate, validateRequest({ body: capturePayPalOrderBodySchema }),
  paymentController.capturePayPalOrder
);

router.post(
  '/purchase-hunt-permit',
  authenticate, validateRequest({ body: purchaseHuntPermitBodySchema }),
  paymentController.purchaseHuntPermit
);

router.get('/get-all-payment-transactions', authenticate, authorizeAdmin, paymentController.getAllTransactions);

export default router;
