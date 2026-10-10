import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validateRequest } from '../../middlewares/validation.middleware';
import {
  createPayPalOrderBodySchema,
  capturePayPalOrderBodySchema,
  purchaseHuntPermitBodySchema,
} from './payment.validation';

const router = Router();

// Action-Oriented PayPal Payment Endpoints
router.post(
  '/create-paypal-order',
  validateRequest({ body: createPayPalOrderBodySchema }),
  paymentController.createPayPalOrder
);

router.post(
  '/capture-paypal-order',
  validateRequest({ body: capturePayPalOrderBodySchema }),
  paymentController.capturePayPalOrder
);

router.post(
  '/purchase-hunt-permit',
  validateRequest({ body: purchaseHuntPermitBodySchema }),
  paymentController.purchaseHuntPermit
);

router.get('/get-all-payment-transactions', paymentController.getAllTransactions);

export default router;
