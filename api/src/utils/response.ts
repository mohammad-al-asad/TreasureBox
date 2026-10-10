export interface SuccessResponse<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorType: string;
  errors?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorType: string;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, errorType: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const sendSuccess = <T>(message: string, data?: T): SuccessResponse<T> => {
  return {
    success: true,
    message,
    ...(data !== undefined && { data }),
  };
};

export const sendError = (
  message: string,
  errorType: string,
  errors?: unknown
): ErrorResponse => {
  return {
    success: false,
    message,
    errorType,
    ...(errors !== undefined && { errors }),
  };
};
