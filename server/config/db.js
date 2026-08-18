import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

/**
 * Opens the Mongoose connection to MongoDB Atlas. Call once at boot.
 * Resolves once the initial connection is established; rejects if it
 * cannot connect so the caller can decide whether to exit the process.
 */
export async function connectDB() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is not set — cannot connect to the database.');
  }

  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

/** Closes the Mongoose connection gracefully (used on shutdown and in tests). */
export async function disconnectDB() {
  await mongoose.disconnect();
}
