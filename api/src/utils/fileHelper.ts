import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Checks if a string is a base64 Data URI and saves it as a real physical file.
 * Returns the relative path e.g. "uploads/images/media_123456_abc.jpg".
 * If already a normal path or URL, returns it unchanged.
 */
export function saveBase64ToFile(dataString?: string | null, subfolder = 'images'): string {
  if (!dataString || typeof dataString !== 'string') {
    return dataString || '';
  }

  // If not a data URI, return as-is
  if (!dataString.startsWith('data:')) {
    return dataString;
  }

  const matches = dataString.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return dataString;
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];

  let ext = 'jpg';
  if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('gif')) ext = 'gif';
  else if (mimeType.includes('svg')) ext = 'svg';
  else if (mimeType.includes('mp4')) ext = 'mp4';
  else if (mimeType.includes('mov')) ext = 'mov';
  else if (mimeType.includes('jpeg')) ext = 'jpg';

  const buffer = Buffer.from(base64Data, 'base64');
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const filename = `media_${Date.now()}_${randomSuffix}.${ext}`;

  const targetDir = path.join(process.cwd(), 'uploads', subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const absoluteFilePath = path.join(targetDir, filename);
  fs.writeFileSync(absoluteFilePath, buffer);

  return `uploads/${subfolder}/${filename}`;
}
