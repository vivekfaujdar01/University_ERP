import { Request, Response, NextFunction } from 'express';
import { catchAsync } from './catchAsync';

// Minimal express mocks
const mockReq = {} as Request;
const mockRes = {} as Response;

describe('catchAsync', () => {
  it('should call the wrapped async function with req, res, next', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = catchAsync(handler);

    const next = jest.fn() as unknown as NextFunction;
    wrapped(mockReq, mockRes, next);

    // Allow microtask queue to flush
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith(mockReq, mockRes, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with the error when the async function rejects', async () => {
    const error = new Error('async boom');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = catchAsync(handler);

    const next = jest.fn() as unknown as NextFunction;
    wrapped(mockReq, mockRes, next);

    await Promise.resolve();
    // Give the rejection handler one more tick to run
    await Promise.resolve();

    expect(next).toHaveBeenCalledWith(error);
  });
});
