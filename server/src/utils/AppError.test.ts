import { AppError } from '../utils/AppError';

describe('AppError', () => {
  it('should create an operational error with correct properties', () => {
    const err = new AppError('Not found', 404);

    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('error');
    expect(err.isOperational).toBe(true);
  });

  it('should set status to "fail" for 5xx errors', () => {
    const err = new AppError('Server failure', 500, false);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(false);
  });

  it('should include structured errors array when provided', () => {
    const errors = [{ field: 'email', message: 'Invalid email' }];
    const err = new AppError('Validation failed', 400, true, errors);
    expect(err.errors).toEqual(errors);
  });

  it('should be an instance of Error', () => {
    const err = new AppError('Test', 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});
