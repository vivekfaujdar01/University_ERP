import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as authService from '../services/authService';
import { env } from '../config/env';
import type { LoginInput } from '../validators/authSchemas';

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

function refreshTokenCookieOptions(expiryMs: number): typeof cookieOptions & { maxAge: number } {
  return {
    ...cookieOptions,
    maxAge: expiryMs,
  };
}

function parseExpiryMs(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 0);
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns: accessToken in body, refreshToken as httpOnly cookie
 */
export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const { tokens, user } = await authService.login(email, password);

  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    refreshTokenCookieOptions(parseExpiryMs(env.JWT_REFRESH_EXPIRY))
  );

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: tokens.accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    },
  });
});

/**
 * POST /api/v1/auth/refresh
 * Reads refreshToken from httpOnly cookie, returns new access + refresh token pair.
 */
export const refreshHandler = catchAsync(async (req: Request, res: Response) => {
  const incomingToken: string | undefined = req.cookies[REFRESH_COOKIE] as
    | string
    | undefined;

  if (!incomingToken) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'No refresh token. Please log in.',
    });
    return;
  }

  const { tokens, user } = await authService.refresh(incomingToken);

  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    refreshTokenCookieOptions(parseExpiryMs(env.JWT_REFRESH_EXPIRY))
  );

  res.status(200).json({
    status: 'success',
    data: {
      accessToken: tokens.accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Revokes the refresh token and clears the cookie.
 */
export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
  const incomingToken: string | undefined = req.cookies[REFRESH_COOKIE] as
    | string
    | undefined;

  if (incomingToken) {
    await authService.logout(incomingToken);
  }

  res.clearCookie(REFRESH_COOKIE, cookieOptions);

  res.status(200).json({
    status: 'success',
    data: { message: 'Logged out successfully.' },
  });
});

/**
 * GET /api/v1/auth/me
 * Requires: authenticate middleware
 * Returns: current user's profile.
 */
export const getMeHandler = catchAsync(async (req: Request, res: Response) => {
  // req.user is set by authenticate middleware
  const user = await authService.getMe(String(req.user!._id));

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});
