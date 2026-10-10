import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    // Resolve DNS SRV queries via Google and Cloudflare DNS to prevent Windows/ISP querySrv ECONNREFUSED
    if (env.MONGO_URI.startsWith('mongodb+srv://')) {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    }
    mongoose.connection.on('connected', () => {
      logger.info('Database connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });

    await mongoose.connect(env.MONGO_URI);
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};
