import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redisClient = env.REDIS_URL ? createClient({ url: env.REDIS_URL }) : null;

export const connectRedis = async (): Promise<void> => {
  if (!redisClient) {
    logger.warn('Redis URL not configured. Redis-backed features will run in degraded mode');
    return;
  }

  redisClient.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  await redisClient.connect();
  logger.info('Redis connected successfully');
};
