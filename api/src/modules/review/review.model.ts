import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  rating: number;
  comment?: string;
  moderationStatus: 'VISIBLE' | 'HIDDEN' | 'FLAGGED';
  moderationNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1200 },
    moderationStatus: { type: String, enum: ['VISIBLE', 'HIDDEN', 'FLAGGED'], default: 'VISIBLE' },
    moderationNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ provider: 1, createdAt: -1 });
reviewSchema.index({ moderationStatus: 1, createdAt: -1 });

export const Review = model<IReview>('Review', reviewSchema);
