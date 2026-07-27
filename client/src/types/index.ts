// Shared TypeScript interfaces for client
// These mirror the server's Mongoose document types but without Document methods

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
  FINANCE_OFFICER: 'finance_officer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// API Response shapes (from Rules.md)
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
}

export interface ApiList<T> {
  status: 'success';
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}
