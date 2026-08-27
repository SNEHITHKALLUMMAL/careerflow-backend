import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1; // 1 = connected
    const statusCode = isDbConnected ? 200 : 503;

    new ApiResponse(
      statusCode,
      {
        status: isDbConnected ? 'ok' : 'degraded',
        uptimeSeconds: Math.floor(process.uptime()),
        database: MONGO_STATES[mongoose.connection.readyState] || 'unknown',
        timestamp: new Date().toISOString(),
      },
      isDbConnected ? 'CareerFlow API is running' : 'CareerFlow API is running but the database is unavailable'
    ).send(res);
  })
);

export default router;
