import { Document } from 'mongoose';

export type LegalDocType = 'TERMS' | 'PRIVACY' | 'ABOUT';

export interface ILegalDoc {
  type: LegalDocType;
  title: string;
  content: string; // HTML format from React-Quill
  updatedAt: Date;
  createdAt: Date;
}

export interface ILegalDocDocument extends ILegalDoc, Document {}

export interface IContactSettings {
  whatsapp: string;
  telegram: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  email: string;
  phone: string;
  workingHoursEn?: string;
  workingHoursAr?: string;
  addressEn?: string;
  addressAr?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface IContactSettingsDocument extends IContactSettings, Document {}
