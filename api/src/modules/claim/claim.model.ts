import { Schema, model } from 'mongoose';
import { IClaimDocument } from './claim.interface';

const claimSchema = new Schema<IClaimDocument>(
  {
    huntId: { type: Schema.Types.ObjectId, ref: 'Hunt', required: true, index: true },
    hunterName: { type: String, required: true, trim: true },
    hunterEmail: { type: String, trim: true, default: '' },
    proofPhotoUrl: { type: String, required: true },
    solvedSequence: { type: String, default: '' },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'PENDING_REVIEW',
      index: true,
    },
    reviewNotes: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

claimSchema.index({ status: 1, createdAt: -1 });

export const Claim = model<IClaimDocument>('Claim', claimSchema);
