import { Schema, model } from 'mongoose';
import { ILegalDocDocument, IContactSettingsDocument } from './settings.interface';

const legalDocSchema = new Schema<ILegalDocDocument>(
  {
    type: {
      type: String,
      enum: ['TERMS', 'PRIVACY', 'ABOUT'],
      required: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const LegalDoc = model<ILegalDocDocument>('LegalDoc', legalDocSchema);

const contactSettingsSchema = new Schema<IContactSettingsDocument>(
  {
    whatsapp: { type: String, default: '+971 50 889 1234' },
    telegram: { type: String, default: 'https://t.me/treasureboxapp' },
    instagram: { type: String, default: 'https://instagram.com/treasurebox' },
    twitter: { type: String, default: 'https://twitter.com/treasurebox' },
    tiktok: { type: String, default: 'https://tiktok.com/@treasurebox' },
    email: { type: String, default: 'support@treasurebox.app' },
    phone: { type: String, default: '+971 50 889 1234' },
    workingHoursEn: { type: String, default: 'Daily: 9:00 AM – 10:00 PM (GST)' },
    workingHoursAr: { type: String, default: 'يومياً: ٩:٠٠ ص – ١٠:٠٠ م (توقيت الخليج)' },
    addressEn: { type: String, default: 'Dubai, United Arab Emirates' },
    addressAr: { type: String, default: 'دبي، الإمارات العربية المتحدة' },
  },
  { timestamps: true }
);

export const ContactSettings = model<IContactSettingsDocument>('ContactSettings', contactSettingsSchema);
