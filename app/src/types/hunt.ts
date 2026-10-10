export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type HuntStatus = "LIVE" | "IN_PROGRESS" | "DRAFT" | "FOUND";

export interface HintItem {
  id: string;
  image: string;
  caption: string;
  captionAr: string;
}

export interface Hunt {
  id: string;
  title: string;
  titleAr: string;
  difficulty: Difficulty;
  price: string;
  isFree: boolean;
  status: HuntStatus;
  coverImage: string;
  galleryImages: string[];
  brief: string;
  briefAr: string;
  cipherSequence: string; // The target sequence
  initialSequence?: string; // The initial configuration
  cipherColumns: number;
  stage1Pin: string;
  stage2Pin: string;
  coordinates?: { latitude: number; longitude: number };
  locationName: string;
  locationNameAr: string;
  hints: HintItem[];
  hintInstructions: string;
  hintInstructionsAr: string;
  cipherHintImage?: string;
  claimedBy?: string;
  capitalWorth?: string;
  categoryName?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export type ScreenName =
  | "splash"
  | "auth"
  | "onboarding"
  | "catalog"
  | "hunt-detail"
  | "checkout"
  | "expedition"
  | "cipher-solved"
  | "location-map"
  | "confirm-find"
  | "completed"
  | "about-us"
  | "terms"
  | "privacy"
  | "profile"
  | "contact-us";
