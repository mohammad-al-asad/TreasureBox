import { LegalDoc, ContactSettings } from './settings.model';
import { ILegalDoc, LegalDocType, IContactSettings } from './settings.interface';

export class SettingsService {
  /**
   * Get legal document by type
   */
  public async getLegalDocument(type: LegalDocType): Promise<ILegalDoc> {
    let doc = await LegalDoc.findOne({ type }).lean();

    // If document doesn't exist yet, seed default content matching Dashboard
    if (!doc) {
      const defaultDocs: Record<LegalDocType, { title: string; content: string }> = {
        TERMS: {
          title: 'Terms & Conditions',
          content: '<h2>1. Operator Access & Duty</h2><p>By accessing the Treasure Box Command Room, operators agree to uphold strict confidentiality.</p>',
        },
        PRIVACY: {
          title: 'Privacy Policy',
          content: '<h2>Data Encryption & Handling</h2><p>All hunter submission photos and coordinates are encrypted end-to-end.</p>',
        },
        ABOUT: {
          title: 'About Us',
          content: '<h2>Treasure Box Command Room</h2><p>Treasure Box is the next-generation real-world treasure hunting & cipher management platform.</p>',
        },
      };

      const created = await LegalDoc.create({
        type,
        title: defaultDocs[type].title,
        content: defaultDocs[type].content,
      });

      return created.toObject() as ILegalDoc;
    }

    return doc as unknown as ILegalDoc;
  }

  /**
   * Update legal document using modern returnDocument: 'after'
   */
  public async updateLegalDocument(
    type: LegalDocType,
    title: string,
    content: string
  ): Promise<ILegalDoc> {
    const updated = await LegalDoc.findOneAndUpdate(
      { type },
      { $set: { title, content } },
      { upsert: true, returnDocument: 'after' }
    ).lean();

    return updated as unknown as ILegalDoc;
  }

  /**
   * Get contact and social channel settings
   */
  public async getContactSettings(): Promise<IContactSettings> {
    let settings = await ContactSettings.findOne().lean();

    if (!settings) {
      const created = await ContactSettings.create({
        whatsapp: '+971 50 889 1234',
        telegram: 'https://t.me/treasureboxapp',
        instagram: 'https://instagram.com/treasurebox',
        twitter: 'https://twitter.com/treasurebox',
        tiktok: 'https://tiktok.com/@treasurebox',
        email: 'support@treasurebox.app',
        phone: '+971 50 889 1234',
        workingHoursEn: 'Daily: 9:00 AM – 10:00 PM (GST)',
        workingHoursAr: 'يومياً: ٩:٠٠ ص – ١٠:٠٠ م (توقيت الخليج)',
        addressEn: 'Dubai, United Arab Emirates',
        addressAr: 'دبي، الإمارات العربية المتحدة',
      });
      return created.toObject() as IContactSettings;
    }

    return settings as unknown as IContactSettings;
  }

  /**
   * Update contact and social channel settings
   */
  public async updateContactSettings(payload: Partial<IContactSettings>): Promise<IContactSettings> {
    const updated = await ContactSettings.findOneAndUpdate(
      {},
      { $set: payload },
      { upsert: true, returnDocument: 'after' }
    ).lean();

    return updated as unknown as IContactSettings;
  }
}

export const settingsService = new SettingsService();
