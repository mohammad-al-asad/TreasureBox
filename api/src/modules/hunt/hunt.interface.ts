import { Document, Types } from 'mongoose';

export type HuntDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type HuntStatus = 'DRAFT' | 'LIVE' | 'IN_PROGRESS' | 'FOUND' | 'ARCHIVED';

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface IHint {
  _id?: Types.ObjectId;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  description?: string;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  order: number;
}

export interface ICipherConfig {
  barrelCount: number;
  targetSequence: string; // e.g. "MALES", uppercase
  initialState: string[]; // e.g. ["M", "A", "🔒", "L", "E"]
  cipherHintEn: string;
  cipherHintAr: string;
  cipherHintImage?: string;
}

export interface IStageLocation {
  coordinates: ICoordinates;
  locationNameEn: string;
  locationNameAr: string;
  instructionsEn?: string;
  instructionsAr?: string;
}

export interface IActiveHunter {
  hunterName: string;
  hunterEmail: string;
  startedAt: Date;
  paymentId?: Types.ObjectId;
  cipherAttempts?: number;
  locked?: boolean;
  lockedAt?: Date;
}

export interface IClaimedRecord {
  hunterName?: string;
  hunterEmail?: string;
  claimedAt?: Date;
  proofPhotoUrl?: string;
}

export interface IHuntVideo {
  url: string;
  description?: string;
}

export interface IHunt {
  titleEn: string;
  titleAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  loreEn: string;
  loreAr: string;
  price: number;
  difficulty: HuntDifficulty;
  status: HuntStatus;
  badgeTextEn?: string;
  badgeTextAr?: string;
  spotImage: string;
  images: string[];
  videos?: IHuntVideo[];

  category?: Types.ObjectId | string;
  categoryName?: string;
  capitalWorth?: string;

  cipher: ICipherConfig;
  stageOne: IStageLocation;
  stageTwo: IStageLocation;
  hints: IHint[];
  activeHunter?: IActiveHunter;
  claimedBy?: IClaimedRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHuntDocument extends IHunt, Document {}
