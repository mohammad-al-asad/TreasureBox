import { Types } from 'mongoose';
import { Payment, IPayment } from './payment.model';
import { Hunt } from '../hunt/hunt.model';
import { AppError } from '../../utils/response';
import { paypalService } from '../../services/paypal.service';
import { Notification } from '../notification/notification.model';
import { broadcastNotification } from '../../sockets/notification.socket';

export class PaymentService {
  /**
   * Create a PayPal order for a hunt permit
   */
  public async createPayPalOrder(
    huntId: string,
    hunterName: string,
    hunterEmail: string,
    returnUrl?: string,
    cancelUrl?: string
  ): Promise<{
    paypalOrderId: string;
    approvalUrl: string;
    amount: number;
    currency: string;
    huntTitle: string;
  }> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid Hunt ID format', 'INVALID_HUNT_ID');
    }

    const hunt = await Hunt.findById(huntId).select('titleEn price status').lean();

    if (!hunt) {
      throw new AppError(404, 'Expedition not found for purchasing permit', 'HUNT_NOT_FOUND');
    }

    if (hunt.status === 'IN_PROGRESS') {
      throw new AppError(409, 'This expedition is currently in progress by another hunter and cannot be taken.', 'HUNT_ALREADY_IN_PROGRESS');
    }

    if (hunt.status === 'FOUND') {
      throw new AppError(409, 'This treasure has already been discovered and claimed.', 'TREASURE_ALREADY_FOUND');
    }

    if (hunt.status !== 'LIVE') {
      throw new AppError(400, 'Permits can only be purchased for active LIVE expeditions.', 'HUNT_NOT_LIVE');
    }

    // Call real PayPal v2 Orders API
    const paypalOrder = await paypalService.createOrder({
      huntId: hunt._id.toString(),
      huntTitle: hunt.titleEn,
      amount: hunt.price,
      currency: 'KWD',
      returnUrl,
      cancelUrl,
    });

    await Payment.create({
      huntId: hunt._id,
      hunterName,
      hunterEmail,
      amount: hunt.price,
      currency: 'KWD',
      paymentMethod: 'PAYPAL',
      paypalOrderId: paypalOrder.orderId,
      status: 'CREATED',
    });

    return {
      paypalOrderId: paypalOrder.orderId,
      approvalUrl: paypalOrder.approvalUrl,
      amount: hunt.price,
      currency: 'KWD',
      huntTitle: hunt.titleEn,
    };
  }

  /**
   * Capture and verify PayPal payment via PayPal v2 API
   */
  public async capturePayPalOrder(
    paypalOrderId: string,
    clientCaptureId?: string
  ): Promise<IPayment> {
    const payment = await Payment.findOne({ paypalOrderId });

    if (!payment) {
      throw new AppError(404, 'PayPal order record not found in system', 'PAYPAL_ORDER_NOT_FOUND');
    }

    if (payment.status === 'COMPLETED') {
      return payment;
    }

    // Call PayPal v2 Capture API to verify and settle payment
    const captureResult = await paypalService.captureOrder(paypalOrderId);

    if (captureResult.status !== 'COMPLETED') {
      throw new AppError(
        400,
        `PayPal transaction could not be completed. Current PayPal status: ${captureResult.status}`,
        'PAYMENT_NOT_COMPLETED'
      );
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { paypalOrderId },
      {
        $set: {
          status: 'COMPLETED',
          paypalCaptureId: captureResult.captureId || clientCaptureId || `CAP-${captureResult.orderId}`,
          purchasedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedPayment) {
      throw new AppError(500, 'Failed to update payment record after PayPal capture', 'CAPTURE_RECORD_UPDATE_FAILED');
    }

    // Atomically transition the Hunt to IN_PROGRESS so no other hunter can take it
    await Hunt.findOneAndUpdate(
      { _id: payment.huntId, status: 'LIVE' },
      {
        $set: {
          status: 'IN_PROGRESS',
          activeHunter: {
            hunterName: payment.hunterName,
            hunterEmail: payment.hunterEmail,
            startedAt: new Date(),
            paymentId: updatedPayment._id,
          },
        },
      },
      { returnDocument: 'after' }
    );

    // Create In-App Notification for Admins & Broadcast via Realtime Socket
    try {
      const hunt = await Hunt.findById(payment.huntId).select('titleEn').lean();
      const huntTitle = hunt?.titleEn || 'Expedition';

      const notification = await Notification.create({
        recipient: payment.huntId,
        recipientRole: 'ADMIN',
        title: 'New Payment Received',
        body: `${payment.hunterName} paid ${payment.amount.toFixed(2)} ${payment.currency || 'KWD'} for "${huntTitle}" permit. Expedition is now IN PROGRESS.`,
        channel: 'IN_APP',
        deliveryStatus: 'SENT',
        metadata: {
          type: 'PAYMENT_SUCCESS',
          paypalOrderId: payment.paypalOrderId,
          amount: payment.amount.toString(),
          hunterName: payment.hunterName,
          hunterEmail: payment.hunterEmail,
        },
      });

      broadcastNotification({
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.body,
        type: 'PAYMENT_SUCCESS',
        createdAt: notification.createdAt,
        data: {
          amount: payment.amount,
          hunterName: payment.hunterName,
          huntTitle,
          paypalOrderId: payment.paypalOrderId,
        },
      });
    } catch {
      // Non-blocking notification emission failure
    }

    return updatedPayment as unknown as IPayment;
  }

  /**
   * Purchase hunt permit directly (In-App checkout / permit acquisition)
   * Atomically locks the hunt into IN_PROGRESS so no other hunter can take it.
   */
  public async purchaseHuntPermit(payload: {
    huntId: string;
    hunterName: string;
    hunterEmail: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; message: string; payment: IPayment; hunt: unknown }> {
    const { huntId, hunterName, hunterEmail, paymentMethod = 'IN_APP_CHECKOUT' } = payload;

    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_HUNT_ID');
    }

    const hunt = await Hunt.findById(huntId).lean();
    if (!hunt) {
      throw new AppError(404, 'Expedition not found for purchasing permit', 'HUNT_NOT_FOUND');
    }

    const isFreeHunt = !hunt.price || hunt.price === 0;

    if (hunt.status === 'FOUND') {
      throw new AppError(
        409,
        'This treasure has already been discovered and verified.',
        'TREASURE_ALREADY_FOUND'
      );
    }

    const currentStatus = hunt.status as string;
    if (currentStatus === 'IN_PROGRESS' && !isFreeHunt) {
      if (hunt.activeHunter?.hunterEmail === hunterEmail) {
        const existingPayment = await Payment.findOne({ huntId: hunt._id, hunterEmail }).lean();
        return {
          success: true,
          message: 'Permit already active for this expedition.',
          payment: existingPayment as unknown as IPayment,
          hunt,
        };
      }
      throw new AppError(
        409,
        'This expedition is already in progress by another hunter and cannot be claimed.',
        'HUNT_ALREADY_IN_PROGRESS'
      );
    }

    if (currentStatus !== 'LIVE' && currentStatus !== 'IN_PROGRESS') {
      throw new AppError(
        400,
        'Permits can only be issued for active LIVE expeditions.',
        'HUNT_NOT_LIVE'
      );
    }

    // Create payment record with COMPLETED status
    const payment = await Payment.create({
      huntId: hunt._id,
      hunterName,
      hunterEmail,
      amount: isFreeHunt ? 0 : hunt.price,
      currency: 'KWD',
      paymentMethod: isFreeHunt ? 'FREE_PERMIT' : paymentMethod,
      paypalOrderId: `PERMIT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      paypalCaptureId: `CAP-${Date.now()}`,
      status: 'COMPLETED',
      purchasedAt: new Date(),
    });

    let activeHunt: any = hunt;

    // For paid hunts, atomically transition the Hunt to IN_PROGRESS
    // For free hunts, keep status LIVE so all community hunters can participate!
    if (!isFreeHunt) {
      activeHunt = await Hunt.findOneAndUpdate(
        { _id: hunt._id, status: 'LIVE' },
        {
          $set: {
            status: 'IN_PROGRESS',
            activeHunter: {
              hunterName,
              hunterEmail,
              startedAt: new Date(),
              paymentId: payment._id,
            },
          },
        },
        { returnDocument: 'after' }
      ).lean();
    }

    // Emit notification to Operator / Dashboard
    try {
      const notification = await Notification.create({
        recipient: hunt._id,
        recipientRole: 'ADMIN',
        title: 'Hunt Permit Acquired',
        body: `${hunterName} acquired permit for "${hunt.titleEn}". Expedition is active!`,
        channel: 'IN_APP',
        deliveryStatus: 'SENT',
        metadata: {
          type: 'PAYMENT_SUCCESS',
          huntId: hunt._id.toString(),
          amount: hunt.price.toString(),
          hunterName,
          hunterEmail,
        },
      });

      broadcastNotification({
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.body,
        type: 'PAYMENT_SUCCESS',
        createdAt: notification.createdAt,
        data: {
          amount: hunt.price,
          hunterName,
          huntTitle: hunt.titleEn,
          huntId: hunt._id.toString(),
        },
      });
    } catch {
      // Non-blocking notification emission failure
    }

    return {
      success: true,
      message: 'Expedition permit acquired successfully! The hunt is now active for you.',
      payment: payment as unknown as IPayment,
      hunt: activeHunt || hunt,
    };
  }



  /**
   * Get all payment transactions for Dashboard finance overview
   */
  public async getAllTransactions(): Promise<IPayment[]> {
    const transactions = await Payment.find()
      .populate('huntId', 'titleEn price difficulty')
      .sort({ createdAt: -1 })
      .lean();

    return transactions as unknown as IPayment[];
  }
}

export const paymentService = new PaymentService();
