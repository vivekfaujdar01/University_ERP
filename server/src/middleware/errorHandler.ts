import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

interface ErrorResponse {
  status: string;
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  stack?: string;
}

/**
 * Handle Mongoose CastError (invalid ObjectId format)
 */
const handleCastError = (err: { path: string; value: unknown }): AppError => {
  return new AppError(`Invalid ${err.path}: ${String(err.value)}`, 400);
};

/**
 * Handle Mongoose duplicate key error (code 11000)
 */
const handleDuplicateKey = (err: { keyValue: Record<string, unknown> }): AppError => {
  const field = Object.keys(err.keyValue)[0] ?? 'field';
  const value = String(err.keyValue[field]);
  return new AppError(`${field} '${value}' already exists.`, 409);
};

/**
 * Handle Mongoose validation errors
 */
const handleValidationError = (err: { errors: Record<string, { message: string }> }): AppError => {
  const errors = Object.values(err.errors).map((e) => ({ message: e.message }));
  return new AppError('Validation failed', 400, true, errors);
};

/**
 * Handle Zod validation errors
 */
const handleZodError = (err: ZodError): AppError => {
  const errors = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  return new AppError('Validation failed', 400, true, errors);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

/**
 * Global error handler middleware (must be 4-argument to be recognized by Express)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error & Record<string, unknown>,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err['name'] === 'CastError') {
    error = handleCastError((err as unknown) as { path: string; value: unknown });
  } else if (err['code'] === 11000) {
    error = handleDuplicateKey((err as unknown) as { keyValue: Record<string, unknown> });
  } else if (err['name'] === 'ValidationError') {
    error = handleValidationError(
      (err as unknown) as { errors: Record<string, { message: string }> }
    );
  } else if (err['name'] === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err['name'] === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else {
    error = new AppError('Something went wrong. Please try again.', 500, false);
  }

  const response: ErrorResponse = {
    status: error.status,
    statusCode: error.statusCode,
    message: error.message,
  };

  if (error.errors) {
    response.errors = error.errors;
  }

  // Include stack trace only in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Log non-operational errors (programming bugs)
  if (!error.isOperational) {
    process.stderr.write(`[UNHANDLED ERROR] ${err.stack ?? err.message}\n`);
  }

  res.status(error.statusCode).json(response);
};
