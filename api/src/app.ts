import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { AppError, sendSuccess } from './utils/response';
import { apiRateLimiter } from './middlewares/rate-limit.middleware';
import { getSignedUploadUrl, isS3Enabled } from './services/storage.service';

const app = express();

// Behind nginx: trust X-Forwarded-* so req.protocol, req.ip and rate limiting see the real client
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving for avatars and assets
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
// Files stored in S3: redirect to a short-lived signed URL
app.get('/uploads/*', async (req, res, next) => {
  if (!isS3Enabled()) return next();
  try {
    const signedUrl = await getSignedUploadUrl(decodeURIComponent(req.path.replace(/^\/uploads\//, '')));
    if (!signedUrl) return next();
    res.set('Cache-Control', 'private, max-age=300');
    return res.redirect(302, signedUrl);
  } catch (error) {
    return next(error);
  }
});
app.use('/uploads', (req, res) => {
  const defaultFallbackImage = path.join(uploadsPath, 'images', 'default-hunt.jpg');
  if (fs.existsSync(defaultFallbackImage)) {
    return res.sendFile(defaultFallbackImage);
  }
  return res.status(404).json({
    success: false,
    message: `Asset ${req.originalUrl} not found on server`,
    errorType: 'ASSET_NOT_FOUND',
  });
});

app.use(apiRateLimiter);

app.get(['/', '/health'], (_req, res) => {
  res.status(200).json(sendSuccess('Service Platform API is healthy', { uptime: process.uptime() }));
});

// Render sends HEAD requests for health checks
app.head(['/', '/health'], (_req, res) => {
  res.status(200).end();
});

app.use('/api/v1', routes);

app.use((req, _res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} was not found`, 'ROUTE_NOT_FOUND'));
});

app.use(errorMiddleware);

export default app;
