import { Document, Types } from 'mongoose';

export type ClaimStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface IClaim {
  huntId: Types.ObjectId;
  hunterName: string;
  hunterEmail?: string;
  proofPhotoUrl: string;
  solvedSequence?: string;
  status: ClaimStatus;
  reviewNotes?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClaimDocument extends IClaim, Document {}
