import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'CLIENT_URL',
] as const;

// Validate all required env vars are present
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  PORT: parseInt(process.env['PORT'] ?? '5000', 10),
  MONGO_URI: process.env['MONGO_URI'] as string,
  JWT_SECRET: process.env['JWT_SECRET'] as string,
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] as string,
  JWT_ACCESS_EXPIRY: process.env['JWT_ACCESS_EXPIRY'] as string,
  JWT_REFRESH_EXPIRY: process.env['JWT_REFRESH_EXPIRY'] as string,
  CLIENT_URL: process.env['CLIENT_URL'] as string,
  SMTP_HOST: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
  SMTP_USER: process.env['SMTP_USER'] ?? '',
  SMTP_PASS: process.env['SMTP_PASS'] ?? '',
  FROM_EMAIL: process.env['FROM_EMAIL'] ?? 'noreply@university.edu',
  RAZORPAY_KEY_ID: process.env['RAZORPAY_KEY_ID'] ?? '',
  RAZORPAY_KEY_SECRET: process.env['RAZORPAY_KEY_SECRET'] ?? '',
  STRIPE_SECRET_KEY: process.env['STRIPE_SECRET_KEY'] ?? '',
  STRIPE_WEBHOOK_SECRET: process.env['STRIPE_WEBHOOK_SECRET'] ?? '',
  PDF_TEMPLATE_DIR: process.env['PDF_TEMPLATE_DIR'] ?? './src/templates',
} as const;
