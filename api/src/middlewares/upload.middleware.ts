import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/response';

const avatarUploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarUploadsDir)) {
  fs.mkdirSync(avatarUploadsDir, { recursive: true });
}

const avatarDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarUploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarDiskStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file format. Only image files are allowed.', 'INVALID_FILE_TYPE'));
    }
  },
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(500, 'Failed to upload asset to Cloudinary', 'UPLOAD_ERROR', error));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const huntUploadsDir = path.join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(huntUploadsDir)) {
  fs.mkdirSync(huntUploadsDir, { recursive: true });
}

const huntDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, huntUploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `hunt-${uniqueSuffix}${ext}`);
  },
});

export const uploadHuntMedia = multer({
  storage: huntDiskStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Invalid file format. Only images and videos are allowed.', 'INVALID_FILE_TYPE'));
    }
  },
});
