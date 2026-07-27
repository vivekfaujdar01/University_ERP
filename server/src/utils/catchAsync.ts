import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

/**
 * catchAsync — Wraps async route handlers to catch promise rejections
 * and forward them to the global error handler via next().
 * Eliminates the need for try-catch in every controller.
 */
export const catchAsync = (fn: AsyncController): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
