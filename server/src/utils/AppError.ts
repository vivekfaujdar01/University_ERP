/**
 * AppError — Operational error class for all known, expected errors.
 * Pass isOperational=true for errors that should be returned to the client.
 * Pass isOperational=false for programming errors (triggers server crash).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field?: string; message: string }>;

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    errors?: Array<{ field?: string; message: string }>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'error' : 'fail';
    this.isOperational = isOperational;
    this.errors = errors;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
