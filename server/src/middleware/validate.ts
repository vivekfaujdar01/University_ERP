import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * validate — Express middleware factory that validates req.body against a Zod schema.
 * On failure it formats errors and passes an AppError to the global error handler.
 */
export const validate =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 400, true, errors));
    }
    // Replace req.body with the parsed (typed + sanitised) value
    req.body = result.data as Record<string, unknown>;
    next();
  };
