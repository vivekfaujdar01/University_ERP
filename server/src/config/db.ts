import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    // Using process.stdout to avoid ESLint no-console warnings in dev infra code
    process.stdout.write(`[MongoDB] Connected: ${conn.connection.host}\n`);
  } catch (error) {
    process.stderr.write(`[MongoDB] Connection failed: ${String(error)}\n`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  process.stderr.write('[MongoDB] Disconnected\n');
});

mongoose.connection.on('error', (err: Error) => {
  process.stderr.write(`[MongoDB] Error: ${err.message}\n`);
});
