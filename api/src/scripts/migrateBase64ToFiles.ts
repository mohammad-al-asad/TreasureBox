import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Hunt } from '../modules/hunt/hunt.model';
import { saveBase64ToFile } from '../utils/fileHelper';
import { logger } from '../utils/logger';

async function runMigration() {
  logger.info('Starting Base64 to physical file migration...');
  await connectDatabase();

  const hunts = await Hunt.find({}).lean();
  logger.info(`Found ${hunts.length} expeditions in database.`);

  let totalUpdated = 0;
  let totalFilesSaved = 0;

  for (const hunt of hunts) {
    let hasChanges = false;
    const updates: Record<string, unknown> = {};

    // 1. spotImage
    if (hunt.spotImage && typeof hunt.spotImage === 'string' && hunt.spotImage.startsWith('data:')) {
      const savedPath = saveBase64ToFile(hunt.spotImage, 'images');
      updates.spotImage = savedPath;
      hasChanges = true;
      totalFilesSaved++;
    }

    // 2. images array
    if (Array.isArray(hunt.images) && hunt.images.length > 0) {
      let imagesChanged = false;
      const newImages = hunt.images.map((img) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          imagesChanged = true;
          totalFilesSaved++;
          return saveBase64ToFile(img, 'images');
        }
        return img;
      });
      if (imagesChanged) {
        updates.images = newImages;
        hasChanges = true;
      }
    }

    // 3. cipher.cipherHintImage
    if (
      hunt.cipher &&
      typeof hunt.cipher.cipherHintImage === 'string' &&
      hunt.cipher.cipherHintImage.startsWith('data:')
    ) {
      const savedPath = saveBase64ToFile(hunt.cipher.cipherHintImage, 'images');
      updates['cipher.cipherHintImage'] = savedPath;
      hasChanges = true;
      totalFilesSaved++;
    }

    // 4. hints array
    if (Array.isArray(hunt.hints) && hunt.hints.length > 0) {
      let hintsChanged = false;
      const newHints = hunt.hints.map((hint) => {
        let hImg = hint.imageUrl;
        let hMedia = hint.mediaUrl;

        if (typeof hImg === 'string' && hImg.startsWith('data:')) {
          hImg = saveBase64ToFile(hImg, 'images');
          hintsChanged = true;
          totalFilesSaved++;
        }
        if (typeof hMedia === 'string' && hMedia.startsWith('data:')) {
          hMedia = saveBase64ToFile(hMedia, 'images');
          hintsChanged = true;
          totalFilesSaved++;
        }

        return {
          ...hint,
          imageUrl: hImg,
          mediaUrl: hMedia,
        };
      });

      if (hintsChanged) {
        updates.hints = newHints;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await Hunt.updateOne({ _id: hunt._id }, { $set: updates });
      logger.info(`Migrated expedition "${hunt.titleEn}" (_id: ${hunt._id})`);
      totalUpdated++;
    }
  }

  logger.info(`Migration finished successfully!`);
  logger.info(`Total expeditions updated in MongoDB: ${totalUpdated}`);
  logger.info(`Total files saved to uploads/images/: ${totalFilesSaved}`);

  await mongoose.disconnect();
  process.exit(0);
}

runMigration().catch((err) => {
  logger.error('Migration failed with error:', err);
  process.exit(1);
});
