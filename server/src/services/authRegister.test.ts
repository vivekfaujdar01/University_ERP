import { register } from './authService';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { AppError } from '../utils/AppError';

jest.mock('../models/User');
jest.mock('../models/RefreshToken');
jest.mock('../config/env', () => ({
  env: {
    JWT_SECRET: 'test_jwt_secret',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    NODE_ENV: 'test',
  },
}));

describe('authService.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully and issue tokens', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'New Student',
      email: 'newstudent@university.edu',
      role: 'student',
      isActive: true,
    };
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (RefreshToken.create as jest.Mock).mockResolvedValue({});

    const result = await register({
      name: 'New Student',
      email: 'newstudent@university.edu',
      password: 'Password123',
      role: 'student',
    });

    expect(User.findOne).toHaveBeenCalledWith({ email: 'newstudent@university.edu' });
    expect(User.create).toHaveBeenCalled();
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.tokens).toHaveProperty('refreshToken');
    expect(result.user).toEqual(mockUser);
  });

  it('should throw 409 AppError if user email already exists', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({ _id: '123', email: 'existing@university.edu' });

    await expect(
      register({
        name: 'Existing User',
        email: 'existing@university.edu',
        password: 'Password123',
        role: 'student',
      })
    ).rejects.toThrow(AppError);
  });
});
