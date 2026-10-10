import { Schema, model, Document, Types } from 'mongoose';

export interface IPortfolioItem extends Document {
  provider: Types.ObjectId;
  title: string;
  description?: string;
  images: string[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const portfolioSchema = new Schema<IPortfolioItem>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 1200 },
    images: { type: [String], required: true, validate: [(value: string[]) => value.length > 0, 'At least one image is required'] },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

portfolioSchema.index({ provider: 1, createdAt: -1 });

export const PortfolioItem = model<IPortfolioItem>('PortfolioItem', portfolioSchema);
