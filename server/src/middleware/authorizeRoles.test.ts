import { Request, Response, NextFunction } from 'express';
import { authorizeRoles } from './authorizeRoles';
import { AppError } from '../utils/AppError';
import { ROLES } from '../config/constants';
import type { IUser } from '../models/User';

describe('authorizeRoles Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should call next with 401 AppError if req.user is missing', () => {
    const middleware = authorizeRoles(ROLES.SUPER_ADMIN);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Not authenticated.');
  });

  it('should call next with 403 AppError if user role is not authorized', () => {
    mockRequest.user = { role: ROLES.STUDENT } as IUser;
    const middleware = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HOD);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
    const error = nextFunction.mock.calls[0][0] as AppError;
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('Access denied');
  });

  it('should call next with no args if user role is authorized', () => {
    mockRequest.user = { role: ROLES.HOD } as IUser;
    const middleware = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HOD);
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
  });
});
