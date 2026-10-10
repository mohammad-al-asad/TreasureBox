import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';
import { logger } from '../utils/logger';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(`${req.method} ${req.originalUrl} - Error:`, err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json(sendError(err.message, err.errorType, err.errors));
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json(sendError('Invalid database reference ID', 'RESOURCE_NOT_FOUND'));
    return;
  }

  res.status(500).json(
    sendError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected server error occurred' 
        : err.message || 'Internal Server Error',
      'INTERNAL_SERVER_ERROR'
    )
  );
};
