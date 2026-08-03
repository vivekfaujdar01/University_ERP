// Application-wide constants

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOD: 'hod',
  FACULTY: 'faculty',
  STUDENT: 'student',
} as const;


export type Role = (typeof ROLES)[keyof typeof ROLES];

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const ATTENDANCE_THRESHOLD = 75; // percentage

export const LATE_FEE_DAILY_RATE = 10; // paise per day (₹0.10/day — configure per structure)

export const MAX_BACKTRACK_DEPTH = 500; // DSA scheduler cap

export const BCRYPT_SALT_ROUNDS = 12;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FILE_UPLOAD = {
  MAX_CSV_SIZE_MB: 5,
  ALLOWED_CSV_MIME_TYPES: ['text/csv', 'application/vnd.ms-excel'],
} as const;
