import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { User, IUser } from '../models/User';
import type { Role } from '../config/constants';

interface JwtAccessPayload {
  userId: string;
  role: Role;
  iat: number;
  exp: number;
}

// Extend Express Request to carry the authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * authenticate — verifies the Bearer access token from the Authorization header.
 * Attaches the full User document to req.user for downstream middleware/controllers.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError('No token provided. Please log in.', 401));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('No token provided. Please log in.', 401));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;

    const user = await User.findById(decoded.userId).select('+passwordHash');
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact admin.', 403));
    }

    req.user = user;
    next();
  } catch {
    // jwt.verify throws JsonWebTokenError / TokenExpiredError — handled by errorHandler
    next(new AppError('Invalid or expired token. Please log in again.', 401));
  }
};
