import { getSocketServer } from './socket';

export const emitNotification = (room: string, payload: unknown): void => {
  getSocketServer()?.to(room).emit('notification:new', payload);
};

export const broadcastNotification = (payload: unknown): void => {
  const io = getSocketServer();
  if (io) {
    io.emit('notification:new', payload);
  }
};

export const broadcastClaim = (payload: unknown): void => {
  const io = getSocketServer();
  if (io) {
    io.emit('claim:new', payload);
  }
};

