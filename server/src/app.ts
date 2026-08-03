import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDB } from './config/db';
import { API_PREFIX } from './config/constants';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';
import healthRouter from './routes/healthRoute';
import authRouter from './routes/authRoutes';
import userRouter from './routes/userRoutes';
import structureRouter from './routes/structureRoutes';
import timetableRouter from './routes/timetableRoutes';
import attendanceRouter from './routes/attendanceRoutes';
import { initCronJobs } from './services/cronService';

const app: Application = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Required for httpOnly cookies (refresh tokens)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiter (global) — auth endpoints have their own rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000,
  message: { status: 'error', statusCode: 429, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);


// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── NoSQL Injection Prevention ───────────────────────────────────────────────
app.use(mongoSanitize());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use(`${API_PREFIX}/health`, healthRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}`, structureRouter);
app.use(`${API_PREFIX}/timetable`, timetableRouter);
app.use(`${API_PREFIX}/attendance`, attendanceRouter);
// app.use(`${API_PREFIX}/departments`, departmentRouter);
// ... (added in T2, T3, T4, ...)

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.all('*', (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Bootstrap ─────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDB();
  initCronJobs();

  const server = app.listen(env.PORT, () => {
    process.stdout.write(
      `[Server] University ERP API running on port ${env.PORT} [${env.NODE_ENV}]\n`
    );
    process.stdout.write(`[Server] Health check: http://localhost:${env.PORT}${API_PREFIX}/health\n`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string): void => {
    process.stdout.write(`\n[Server] ${signal} received. Shutting down gracefully...\n`);
    server.close(() => {
      process.stdout.write('[Server] HTTP server closed.\n');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown) => {
    process.stderr.write(`[Server] UNHANDLED REJECTION: ${String(reason)}\n`);
    server.close(() => process.exit(1));
  });

  // Uncaught exceptions
  process.on('uncaughtException', (err: Error) => {
    process.stderr.write(`[Server] UNCAUGHT EXCEPTION: ${err.message}\n${err.stack ?? ''}\n`);
    process.exit(1);
  });
};

void startServer();

export default app;
