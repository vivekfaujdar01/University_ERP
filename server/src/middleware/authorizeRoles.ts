import { Request, Response, NextFunction } from 'express';
import type { Role } from '../config/constants';
import { AppError } from '../utils/AppError';

/**
 * authorizeRoles — RBAC guard middleware factory.
 * Must be used AFTER authenticate middleware (req.user must be set).
 *
 * @example
 *   router.post('/generate', authenticate, authorizeRoles('super_admin', 'hod'), controller)
 */
export const authorizeRoles =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of: ${roles.join(', ')}.`,
          403
        )
      );
    }

    next();
  };
