import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

export const initializeSocket = (server: Server): SocketServer => {
  io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('join', (room: string) => socket.join(room));
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

export const getSocketServer = (): SocketServer | null => io;
