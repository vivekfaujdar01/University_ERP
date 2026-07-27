import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/AppError';
import type { Role } from '../config/constants';

// ─── Token helpers ─────────────────────────────────────────────────────────

function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as jwt.SignOptions);
}

function generateRefreshTokenValue(): string {
  // 48 random bytes → 96-char hex string — cryptographically secure, opaque token
  return crypto.randomBytes(48).toString('hex');
}

function parseExpiry(expiry: string): number {
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

function sha256hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ─── Public service methods ─────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * login — Validates credentials, returns access + refresh token pair.
 * Refresh token value is stored as SHA-256 hash in DB for fast, safe lookup.
 */
export const login = async (
  email: string,
  password: string
): Promise<{ tokens: AuthTokens; user: IUser }> => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact admin.', 403);
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  const tokens = await issueTokens(user);
  return { tokens, user };
};

/**
 * refresh — Validates incoming opaque refresh token via SHA-256 DB lookup,
 * rotates it (old token revoked, new pair issued).
 */
export const refresh = async (
  incomingToken: string
): Promise<{ tokens: AuthTokens; user: IUser }> => {
  const hash = sha256hex(incomingToken);

  const storedToken = await RefreshToken.findOne({
    tokenHash: hash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate<{ user: IUser }>('user');

  if (!storedToken) {
    throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
  }

  const user = storedToken.user;
  if (!user?.isActive) {
    throw new AppError('User not found or deactivated.', 401);
  }

  // Rotate — revoke the consumed token
  storedToken.isRevoked = true;
  await storedToken.save();

  const tokens = await issueTokens(user);
  return { tokens, user };
};

/**
 * logout — Revokes the refresh token so it cannot be reused.
 */
export const logout = async (incomingToken: string): Promise<void> => {
  await RefreshToken.updateOne(
    { tokenHash: sha256hex(incomingToken) },
    { isRevoked: true }
  );
};

/**
 * getMe — Returns the current user document (password excluded).
 */
export const getMe = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return user;
};

// ─── Internal helper ────────────────────────────────────────────────────────

async function issueTokens(user: IUser): Promise<AuthTokens> {
  const accessToken = signAccessToken(String(user._id), user.role);
  const rawRefresh = generateRefreshTokenValue();
  const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRY));

  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256hex(rawRefresh),
    expiresAt,
  });

  return { accessToken, refreshToken: rawRefresh };
}
