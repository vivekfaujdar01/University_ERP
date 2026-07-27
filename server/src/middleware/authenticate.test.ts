import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './authenticate';
import { AppError } from '../utils/AppError';
import { User } from '../models/User';
import { env } from '../config/env';

jest.mock('../models/User');

describe('authenticate Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next with 401 if no Authorization header is present', async () => {
    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('No token provided');
  });

  it('should call next with 401 if header does not start with Bearer', async () => {
    mockRequest.headers = { authorization: 'Basic token123' };
    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
  });

  it('should call next with 401 if token is invalid or expired', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid_token' };
    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toContain('Invalid or expired token');
  });

  it('should attach user to req and call next if token is valid and user is active', async () => {
    const validToken = jwt.sign({ userId: 'user123', role: 'student' }, env.JWT_SECRET);
    mockRequest.headers = { authorization: `Bearer ${validToken}` };

    const mockUser = { _id: 'user123', role: 'student', isActive: true };
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toBe(mockUser);
    expect(nextFunction).toHaveBeenCalledWith();
  });

  it('should call next with 403 if user account is deactivated', async () => {
    const validToken = jwt.sign({ userId: 'user123', role: 'student' }, env.JWT_SECRET);
    mockRequest.headers = { authorization: `Bearer ${validToken}` };

    const mockUser = { _id: 'user123', role: 'student', isActive: false };
    (User.findById as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('deactivated');
  });
});
