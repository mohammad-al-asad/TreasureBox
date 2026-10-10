import { getSocketServer } from './socket';

export const emitRequestUpdate = (room: string, payload: unknown): void => {
  getSocketServer()?.to(room).emit('request:update', payload);
};
