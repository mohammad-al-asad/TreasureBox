import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { env } from './config/env';
import { startNotificationJobs } from './jobs/notification.job';
import { startPaymentJobs } from './jobs/payment.job';
import { startSubscriptionJobs } from './jobs/subscription.job';
import { initializeSocket } from './sockets/socket';
import { logger } from './utils/logger';
import { createServer } from 'http';

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();

  const httpServer = createServer(app);
  initializeSocket(httpServer);
  startNotificationJobs();
  startPaymentJobs();
  startSubscriptionJobs();

  httpServer.listen(env.PORT, () => {
    logger.info(`Service Platform API server running on port ${env.PORT}`);
  });
};

startServer().catch((error: Error) => {
  logger.error('Failed to start Service Platform API server:', error);
  process.exit(1);
});
