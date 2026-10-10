import { Types } from 'mongoose';
import { Hunt } from './hunt.model';
import { Payment } from '../payment/payment.model';
import { IHunt, IHuntDocument } from './hunt.interface';
import { AppError } from '../../utils/response';
import { saveBase64ToFile } from '../../utils/fileHelper';

export class HuntService {
  /**
   * Automatically convert any Base64 Data URI in hunt payload into real files
   */
  private sanitizeMediaPayload(payload: Partial<IHunt>): Partial<IHunt> {
    const sanitized = { ...payload };

    if (sanitized.spotImage) {
      sanitized.spotImage = saveBase64ToFile(sanitized.spotImage);
    }

    if (Array.isArray(sanitized.images)) {
      sanitized.images = sanitized.images.map((img) => saveBase64ToFile(img));
    }

    if (sanitized.cipher) {
      sanitized.cipher = {
        ...sanitized.cipher,
        cipherHintImage: saveBase64ToFile(sanitized.cipher.cipherHintImage),
      };
    }

    if (Array.isArray(sanitized.hints)) {
      sanitized.hints = sanitized.hints.map((hint) => ({
        ...hint,
        imageUrl: saveBase64ToFile(hint.imageUrl),
        mediaUrl: saveBase64ToFile(hint.mediaUrl),
      }));
    }

    return sanitized;
  }

  /**
   * Create a new expedition (Dashboard / Operator)
   */
  public async createHunt(payload: Partial<IHunt>): Promise<IHuntDocument> {
    const sanitizedPayload = this.sanitizeMediaPayload(payload);
    const hunt = await Hunt.create(sanitizedPayload);
    return hunt;
  }

  /**
   * Get all live expeditions for public hunter mobile app (excludes cipher targetSequence)
   */
  public async getAllLiveHunts(): Promise<Partial<IHunt>[]> {
    const hunts = await Hunt.find({ status: { $in: ['LIVE', 'FOUND'] } })
      .populate('category', 'name slug')
      .select({
        'stageTwo': 0,
      })
      .sort({ createdAt: -1 })
      .lean();

    return hunts as Partial<IHunt>[];
  }

  /**
   * Get all expeditions purchased/claimed by a specific hunter — paginated
   * Returns IN_PROGRESS and FOUND hunts that belong to this user
   */
  public async getMyPurchasedExpeditions(
    hunterEmail: string,
    page: number = 1,
    limit: number = 5
  ): Promise<{
    data: Partial<IHunt>[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  }> {
    if (!hunterEmail || hunterEmail.trim() === '') {
      return { data: [], total: 0, page: 1, totalPages: 1, limit };
    }

    const normalizedEmail = hunterEmail.trim().toLowerCase();
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 20);
    const skip = (safePage - 1) * safeLimit;

    // 1. Find all successful payments made by this hunter
    const payments = await Payment.find({
      hunterEmail: normalizedEmail,
      status: 'COMPLETED',
    })
      .select('huntId')
      .lean();

    const paidHuntIds = payments.map((p) => p.huntId);

    const query = {
      $or: [
        { _id: { $in: paidHuntIds } },
        { 'activeHunter.hunterEmail': normalizedEmail },
        { 'claimedBy.hunterEmail': normalizedEmail },
      ],
    };

    const [hunts, total] = await Promise.all([
      Hunt.find(query)
        .select({ 'stageTwo.coordinates': 0 })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Hunt.countDocuments(query),
    ]);

    return {
      data: hunts as Partial<IHunt>[],
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1,
      limit: safeLimit,
    };
  }


  /**
   * Get single hunt field brief for Mobile App
   */
  public async getHuntDetailsForHunter(huntId: string): Promise<Partial<IHunt>> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_ID');
    }

    const hunt = await Hunt.findById(huntId)
      .select({
        'stageTwo.coordinates': 0,
      })
      .lean();

    if (!hunt) {
      throw new AppError(404, 'Expedition not found or no longer available', 'HUNT_NOT_FOUND');
    }

    return hunt as Partial<IHunt>;
  }

  /**
   * Verify cipher sequence submitted by hunter
   * Limits attempts to 3. If 3 attempts failed, locks the puzzle and resets for repurchase.
   */
  public async verifyCipherSolution(
    huntId: string,
    submittedSequence: string,
    hunterEmail?: string
  ): Promise<{
    solved: boolean;
    locked?: boolean;
    remainingAttempts?: number;
    stageTwo?: {
      coordinates: { latitude: number; longitude: number };
      locationNameEn: string;
      locationNameAr: string;
      instructionsEn?: string;
      instructionsAr?: string;
    };
    message?: string;
  }> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_ID');
    }

    const hunt = await Hunt.findById(huntId);

    if (!hunt) {
      throw new AppError(404, 'Expedition not found', 'HUNT_NOT_FOUND');
    }

    if (hunt.status === 'FOUND') {
      throw new AppError(409, 'This treasure has already been claimed by another hunter', 'TREASURE_ALREADY_FOUND');
    }

    // Check if already locked
    if (hunt.activeHunter?.locked || (hunt.activeHunter?.cipherAttempts || 0) >= 3) {
      return {
        solved: false,
        locked: true,
        remainingAttempts: 0,
        message: 'Puzzle is locked! Maximum 3 attempts reached. Please purchase the permit again to retry.',
      };
    }

    if (!hunt.cipher || typeof hunt.cipher.targetSequence !== 'string') {
      return { solved: false, remainingAttempts: 3, message: 'Invalid cipher configuration' };
    }

    const normalizedSubmitted = submittedSequence.trim().toUpperCase();
    const normalizedTarget = hunt.cipher.targetSequence.trim().toUpperCase();

    if (normalizedSubmitted === normalizedTarget) {
      const finalStageTwo = (hunt.stageTwo && hunt.stageTwo.coordinates)
        ? hunt.stageTwo
        : hunt.stageOne;

      return {
        solved: true,
        remainingAttempts: Math.max(0, 3 - (hunt.activeHunter?.cipherAttempts || 0)),
        stageTwo: finalStageTwo,
      };
    }

    // Incorrect answer: increment attempt counter
    const currentAttempts = (hunt.activeHunter?.cipherAttempts || 0) + 1;
    const remainingAttempts = Math.max(0, 3 - currentAttempts);
    const isLocked = currentAttempts >= 3;

    if (!hunt.activeHunter) {
      hunt.activeHunter = {
        hunterName: 'Hunter',
        hunterEmail: hunterEmail || 'hunter@treasurebox.app',
        startedAt: new Date(),
        cipherAttempts: currentAttempts,
        locked: isLocked,
        lockedAt: isLocked ? new Date() : undefined,
      };
    } else {
      hunt.activeHunter.cipherAttempts = currentAttempts;
      if (isLocked) {
        hunt.activeHunter.locked = true;
        hunt.activeHunter.lockedAt = new Date();
      }
    }

    // If locked, reopen hunt for purchase in store so user can repurchase
    if (isLocked) {
      hunt.status = 'LIVE';
    }

    await hunt.save();

    return {
      solved: false,
      locked: isLocked,
      remainingAttempts,
      message: isLocked
        ? 'Puzzle locked! You have used all 3 attempts. You must purchase the permit again to retry.'
        : `Incorrect cipher sequence. You have ${remainingAttempts} attempt(s) remaining.`,
    };
  }

  /**
   * Get all cabinet hunts for Dashboard (Operator room)
   */
  public async getAllCabinetHunts(filterStatus?: string): Promise<IHuntDocument[]> {
    // Auto-reconcile: Any hunt that has a claim registered should be marked as FOUND
    try {
      const { Claim } = await import('../claim/claim.model');
      const claims = await Claim.find({ status: { $in: ['PENDING_REVIEW', 'VERIFIED'] } })
        .select('huntId hunterName hunterEmail proofPhotoUrl submittedAt')
        .lean();
      for (const cl of claims) {
        if (cl.huntId) {
          await Hunt.updateOne(
            { _id: cl.huntId, status: { $ne: 'FOUND' } },
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

    const query: Record<string, unknown> = {};
    if (filterStatus && filterStatus !== 'ALL') {
      query.status = filterStatus;
    }

    const hunts = await Hunt.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .lean();
    return hunts as unknown as IHuntDocument[];
  }

  /**
   * Get full single cabinet hunt for Operator Edit/Details
   */
  public async getCabinetHuntById(huntId: string): Promise<IHuntDocument> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_ID');
    }

    const hunt = await Hunt.findById(huntId).lean();
    if (!hunt) {
      throw new AppError(404, 'Expedition not found in cabinet', 'HUNT_NOT_FOUND');
    }

    return hunt as unknown as IHuntDocument;
  }

  /**
   * Update hunt details using modern Mongoose returnDocument: 'after'
   */
  public async updateHuntDetails(
    huntId: string,
    payload: Partial<IHunt>
  ): Promise<IHuntDocument> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_ID');
    }

    const sanitizedPayload = this.sanitizeMediaPayload(payload);

    const updated = await Hunt.findByIdAndUpdate(
      huntId,
      { $set: sanitizedPayload },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updated) {
      throw new AppError(404, 'Expedition not found to update', 'HUNT_NOT_FOUND');
    }

    return updated as unknown as IHuntDocument;
  }

  /**
   * Delete / Revoke hunt from system
   */
  public async deleteHunt(huntId: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(huntId)) {
      throw new AppError(400, 'Invalid expedition ID format', 'INVALID_ID');
    }

    const deleted = await Hunt.findByIdAndDelete(huntId).lean();
    if (!deleted) {
      throw new AppError(404, 'Expedition not found to delete', 'HUNT_NOT_FOUND');
    }

    return {
      success: true,
      message: `Expedition "${deleted.titleEn}" deleted successfully`,
    };
  }
}

export const huntService = new HuntService();
