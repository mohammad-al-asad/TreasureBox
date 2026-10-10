import { Types } from 'mongoose';
import { Claim } from './claim.model';
import { IClaim, IClaimDocument } from './claim.interface';
import { Hunt } from '../hunt/hunt.model';
import { AppError } from '../../utils/response';
import { Notification } from '../notification/notification.model';
import { Payment } from '../payment/payment.model';
import { mailerService } from '../../services/mailer.service';
import { generateTreasureFoundEmailHtml } from '../notification/templates/treasureFoundEmail.template';
import { broadcastNotification, broadcastClaim } from '../../sockets/notification.socket';

export class ClaimService {
  /**
   * Submit a new treasure claim with proof photo and hunter name (Mobile App)
   */
  public async submitClaim(payload: Partial<IClaim>): Promise<IClaimDocument> {
    if (!payload.huntId || !Types.ObjectId.isValid(payload.huntId.toString())) {
      throw new AppError(400, 'Invalid expedition ID', 'INVALID_HUNT_ID');
    }

    const hunt = await Hunt.findById(payload.huntId).lean();
    if (!hunt) {
      throw new AppError(404, 'Expedition not found for claiming', 'HUNT_NOT_FOUND');
    }

    if (hunt.status === 'FOUND') {
      throw new AppError(409, 'This treasure has already been discovered and claimed', 'ALREADY_CLAIMED');
    }

    const claim = await Claim.create({
      ...payload,
      status: 'PENDING_REVIEW',
      submittedAt: new Date(),
    });

    // Atomically transition the Hunt to FOUND with hunter claimedBy details
    await Hunt.findByIdAndUpdate(
      payload.huntId,
      {
        $set: {
          status: 'FOUND',
          claimedBy: {
            hunterName: payload.hunterName || 'Hunter',
            hunterEmail: payload.hunterEmail || '',
            claimedAt: new Date(),
            proofPhotoUrl: payload.proofPhotoUrl || null,
          },
        },
      },
      { returnDocument: 'after' }
    );

    const populatedClaim = await Claim.findById(claim._id)
      .populate('huntId', 'titleEn price difficulty stageOne stageTwo')
      .lean();

    // Broadcast Realtime Claim to Dashboard Claims Register
    try {
      broadcastClaim(populatedClaim || claim);
    } catch {
      // Non-blocking claim emission
    }

    // Create Notification & Broadcast Realtime Socket Event
    try {
      const hunterName = payload.hunterName || 'A hunter';
      const notification = await Notification.create({
        recipient: claim._id,
        recipientRole: 'ADMIN',
        title: 'New Treasure Discovered!',
        body: `${hunterName} found the treasure for "${hunt.titleEn}" and submitted proof for review!`,
        channel: 'IN_APP',
        deliveryStatus: 'SENT',
        metadata: {
          type: 'TREASURE_CLAIMED',
          huntId: hunt._id.toString(),
          claimId: claim._id.toString(),
          hunterName,
          hunterEmail: payload.hunterEmail || '',
          huntTitle: hunt.titleEn,
        },
      });

      broadcastNotification({
        _id: notification._id.toString(),
        title: notification.title,
        message: notification.body,
        type: 'TREASURE_CLAIMED',
        createdAt: notification.createdAt,
        data: {
          huntId: hunt._id.toString(),
          claimId: claim._id.toString(),
          hunterName,
          huntTitle: hunt.titleEn,
        },
      });
    } catch {
      // Non-blocking notification emission
    }

    return (populatedClaim || claim) as unknown as IClaimDocument;
  }

  /**
   * Get all claims for the Dashboard Claims Register (Operator review)
   */
  public async getAllClaims(filterStatus?: string): Promise<IClaimDocument[]> {
    const query: Record<string, unknown> = {};
    if (filterStatus && filterStatus !== 'ALL') {
      query.status = filterStatus;
    }

    const claims = await Claim.find(query)
      .populate('huntId', 'titleEn price difficulty stageOne stageTwo')
      .sort({ createdAt: -1 })
      .lean();

    // Reconcile: Ensure any hunt with an active claim is marked as FOUND in database
    try {
      const activeClaimHunts = claims.filter(
        (c) => c.huntId && (c.status === 'PENDING_REVIEW' || c.status === 'VERIFIED')
      );
      for (const cl of activeClaimHunts) {
        const hId = (cl.huntId as any)?._id || cl.huntId;
        if (hId) {
          await Hunt.updateOne(
            { _id: hId, status: { $ne: 'FOUND' } },
            {
              $set: {
                status: 'FOUND',
                'claimedBy.hunterName': cl.hunterName || 'Hunter',
                'claimedBy.hunterEmail': cl.hunterEmail || '',
                'claimedBy.claimedAt': cl.submittedAt || new Date(),
                'claimedBy.proofPhotoUrl': cl.proofPhotoUrl || null,
              },
            }
          );
        }
      }
    } catch {
      // Non-blocking auto-reconciliation
    }

    return claims as unknown as IClaimDocument[];
  }

  /**
   * Verify or reject a claim (Dashboard / Operator)
   * If verified, permanently lock the Hunt as FOUND using modern returnDocument: 'after'
   */
  public async verifyOrRejectClaim(
    claimId: string,
    status: 'VERIFIED' | 'REJECTED',
    reviewNotes?: string
  ): Promise<IClaimDocument> {
    if (!Types.ObjectId.isValid(claimId)) {
      throw new AppError(400, 'Invalid claim ID format', 'INVALID_CLAIM_ID');
    }

    const updatedClaim = await Claim.findByIdAndUpdate(
      claimId,
      {
        $set: {
          status,
          reviewNotes: reviewNotes || '',
          reviewedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    ).lean();

    if (!updatedClaim) {
      throw new AppError(404, 'Claim record not found', 'CLAIM_NOT_FOUND');
    }

    // If verified, seal the hunt permanently as FOUND
    if (status === 'VERIFIED') {
      const sealedHunt = await Hunt.findByIdAndUpdate(
        updatedClaim.huntId,
        {
          $set: {
            status: 'FOUND',
            claimedBy: {
              hunterName: updatedClaim.hunterName,
              hunterEmail: updatedClaim.hunterEmail,
              claimedAt: new Date(),
              proofPhotoUrl: updatedClaim.proofPhotoUrl,
            },
          },
        },
        { returnDocument: 'after' }
      ).lean();

      // Proactively notify all hunters who purchased permits for this expedition
      try {
        const huntTitle = sealedHunt?.titleEn || 'The Expedition';
        const finderName = updatedClaim.hunterName || 'An explorer';

        const purchasers = await Payment.find({
          huntId: updatedClaim.huntId,
          status: 'COMPLETED',
        }).lean();

        const notifiedEmails = new Set<string>();

        for (const purchaser of purchasers) {
          const email = purchaser.hunterEmail?.trim().toLowerCase();
          if (!email || notifiedEmails.has(email)) continue;
          notifiedEmails.add(email);

          // 1. Create In-App Notification Record
          await Notification.create({
            recipient: purchaser._id,
            recipientRole: 'USER',
            title: 'Treasure Found & Expedition Concluded',
            body: `${finderName} has discovered the treasure for "${huntTitle}". This expedition is now sealed!`,
            channel: 'IN_APP',
            deliveryStatus: 'SENT',
            metadata: {
              type: 'TREASURE_FOUND',
              huntId: String(updatedClaim.huntId),
              claimId: String(updatedClaim._id),
              hunterName: finderName,
              huntTitle,
            },
          });

          // 2. Dispatch Official HTML Email to Permit Holder
          try {
            await mailerService.sendMail({
              to: email,
              subject: `[Treasure Box] Expedition Concluded: "${huntTitle}" Treasure Discovered!`,
              html: generateTreasureFoundEmailHtml({
                hunterName: purchaser.hunterName || 'Explorer',
                finderName,
                huntTitle,
              }),
            });
          } catch {
            // Non-blocking mail dispatch
          }
        }

        // 3. Broadcast Realtime Socket Notification across App & Dashboard
        broadcastNotification({
          _id: new Types.ObjectId().toString(),
          title: 'Treasure Discovered & Sealed!',
          message: `${finderName} found the treasure for "${huntTitle}"!`,
          type: 'TREASURE_CLAIMED',
          createdAt: new Date(),
          data: {
            huntId: String(updatedClaim.huntId),
            finderName,
            huntTitle,
          },
        });
      } catch {
        // Non-blocking purchaser notification handling
      }
    }

    return updatedClaim as unknown as IClaimDocument;
  }
}


export const claimService = new ClaimService();
