import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    new ApiResponse(
      200,
      {
        status: 'ok',
        uptimeSeconds: Math.floor(process.uptime()),
        database: MONGO_STATES[mongoose.connection.readyState] || 'unknown',
        timestamp: new Date().toISOString(),
      },
      'CareerFlow API is running'
    ).send(res);
  })
);

export default router;
