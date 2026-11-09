import { Request, Response } from 'express';
import { paymentService } from './payment.service';
import { sendSuccess } from '../../utils/response';
import { asyncHandler } from '../../utils/asyncHandler';

// Routes using these handlers require login: bind the permit to the signed-in account,
// not to whatever email the request body claims.
const accountEmail = (req: Request): string | undefined =>
  (req as Request & { account?: { email?: string } }).account?.email;

export class PaymentController {
  public createPayPalOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { huntId, hunterName, hunterEmail, returnUrl, cancelUrl } = req.body;
    const result = await paymentService.createPayPalOrder(
      huntId,
      hunterName,
      accountEmail(req) || hunterEmail,
      returnUrl,
      cancelUrl
    );
    res.status(201).json(sendSuccess('PayPal order created successfully', result));
  });


  public capturePayPalOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { paypalOrderId, paypalCaptureId } = req.body;
    const result = await paymentService.capturePayPalOrder(paypalOrderId, paypalCaptureId);
    res.status(200).json(sendSuccess('PayPal payment captured and permit granted', result));
  });

  public purchaseHuntPermit = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { huntId, hunterName, hunterEmail, paymentMethod } = req.body;
    const result = await paymentService.purchaseHuntPermit({
      huntId,
      hunterName,
      hunterEmail: accountEmail(req) || hunterEmail,
      paymentMethod,
    });
    res.status(200).json(sendSuccess('Hunt permit acquired successfully', result));
  });

  public getAllTransactions = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const result = await paymentService.getAllTransactions();
    res.status(200).json(sendSuccess('Payment transactions retrieved successfully', result));
  });
}

export const paymentController = new PaymentController();
