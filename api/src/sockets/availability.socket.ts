import { getSocketServer } from './socket';

export const emitAvailabilityUpdate = (providerId: string, payload: unknown): void => {
  getSocketServer()?.to(`provider:${providerId}`).emit('availability:update', payload);
};
