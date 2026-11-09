import fs from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * File storage for uploads.
 *
 * Multer first writes each upload to the local `uploads/` folder. When S3_BUCKET is set,
 * `persistUpload` copies the file to S3 under the same key (e.g. `uploads/images/hunt-123.jpg`)
 * and removes the local copy. URLs stay the same either way (`/uploads/...`): the API serves
 * the local file if it exists, otherwise it redirects to a short-lived signed S3 URL.
 * Credentials come from the server's IAM role, so no AWS keys are needed in the env.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 60;

const s3 = env.S3_BUCKET ? new S3Client({ region: env.AWS_REGION }) : null;

export const isS3Enabled = (): boolean => s3 !== null;

const toKey = (folder: 'images' | 'avatars', filename: string): string => `uploads/${folder}/${filename}`;

export const persistUpload = async (
  file: Express.Multer.File,
  folder: 'images' | 'avatars'
): Promise<void> => {
  if (!s3) return;

  const key = toKey(folder, file.filename);
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentLength: file.size,
      ContentType: file.mimetype,
    })
  );

  fs.promises.unlink(file.path).catch((error) => {
    logger.warn(`Uploaded ${key} to S3 but could not remove local copy:`, error);
  });
};

/** `key` is the request path under /uploads, e.g. `images/hunt-123.jpg`. */
export const getSignedUploadUrl = async (key: string): Promise<string | null> => {
  if (!s3) return null;
  const cleanKey = key.replace(/^\/+/, '');
  if (!cleanKey || cleanKey.includes('..')) return null;

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: `uploads/${cleanKey}` }), {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
};
