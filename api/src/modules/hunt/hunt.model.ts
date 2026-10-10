import { Schema, model } from 'mongoose';
import { IHuntDocument } from './hunt.interface';

const HintSchema = new Schema(
  {
    titleEn: { type: String, default: '', trim: true },
    titleAr: { type: String, default: '', trim: true },
    bodyEn: { type: String, default: '', trim: true },
    bodyAr: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaType: { type: String, enum: ['image', 'video'], default: 'video' },
    order: { type: Number, required: true, default: 1 },
  },
  { _id: true }
);

const CoordinatesSchema = new Schema(
  {
    latitude: { type: Number, default: 25.2644 },
    longitude: { type: Number, default: 55.2982 },
  },
  { _id: false }
);

const StageLocationSchema = new Schema(
  {
    coordinates: { type: CoordinatesSchema, default: () => ({ latitude: 25.2644, longitude: 55.2982 }) },
    locationNameEn: { type: String, default: '', trim: true },
    locationNameAr: { type: String, default: '', trim: true },
    instructionsEn: { type: String, default: '' },
    instructionsAr: { type: String, default: '' },
  },
  { _id: false }
);

const CipherConfigSchema = new Schema(
  {
    barrelCount: { type: Number, default: 5 },
    targetSequence: { type: String, uppercase: true, trim: true, default: 'AAAAA' },
    initialState: { type: [String], default: ['A', 'A', 'A', 'A', 'A'] },
    cipherHintEn: { type: String, default: '' },
    cipherHintAr: { type: String, default: '' },
    cipherHintImage: { type: String, default: '' },
  },
  { _id: false }
);

const ActiveHunterSchema = new Schema(
  {
    hunterName: { type: String, required: true },
    hunterEmail: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
    cipherAttempts: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    lockedAt: { type: Date, default: null },
  },
  { _id: false }
);

const ClaimedRecordSchema = new Schema(
  {
    hunterName: { type: String, default: null },
    hunterEmail: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    proofPhotoUrl: { type: String, default: null },
  },
  { _id: false }
);

const HuntSchema = new Schema<IHuntDocument>(
  {
    titleEn: { type: String, default: 'Untitled Expedition', trim: true, index: true },
    titleAr: { type: String, default: '', trim: true },
    descriptionEn: { type: String, default: '' },
    descriptionAr: { type: String, default: '' },
    loreEn: { type: String, default: '' },
    loreAr: { type: String, default: '' },
    price: { type: Number, default: 0, min: 0 },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'LIVE', 'IN_PROGRESS', 'FOUND', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    categoryName: { type: String, default: '', trim: true },
    capitalWorth: { type: String, default: '', trim: true },
    badgeTextEn: { type: String, default: '' },
    badgeTextAr: { type: String, default: '' },
    spotImage: { type: String, default: '', trim: true },
    images: { type: [String], default: [] },
    videos: [
      {
        url: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],

    cipher: {
      type: CipherConfigSchema,
      default: () => ({
        barrelCount: 5,
        targetSequence: 'AAAAA',
        initialState: ['A', 'A', 'A', 'A', 'A'],
      }),
    },
    stageOne: {
      type: StageLocationSchema,
      default: () => ({
        coordinates: { latitude: 25.2644, longitude: 55.2982 },
        locationNameEn: '',
        locationNameAr: '',
      }),
    },
    stageTwo: { type: StageLocationSchema, required: false, default: null },
    hints: { type: [HintSchema], default: [] },
    activeHunter: { type: ActiveHunterSchema, default: null },
    claimedBy: { type: ClaimedRecordSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optimize frequently queried combinations
HuntSchema.index({ status: 1, createdAt: -1 });
HuntSchema.index({ 'stageOne.coordinates.latitude': 1, 'stageOne.coordinates.longitude': 1 });

export const Hunt = model<IHuntDocument>('Hunt', HuntSchema);
