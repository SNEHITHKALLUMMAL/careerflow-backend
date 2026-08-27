import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

describe('GET /api/v1/health', () => {
  const originalReadyState = mongoose.connection.readyState;

  afterEach(() => {
    mongoose.connection.readyState = originalReadyState;
  });

  it('returns 503 with a degraded status when the database is not connected', async () => {
    mongoose.connection.readyState = 0; // disconnected

    const res = await request(app).get('/api/v1/health');

    expect(res.statusCode).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toBe('degraded');
    expect(res.body.data.database).toBe('disconnected');
  });

  it('returns 200 with an ok status once the database is connected — this is what a healthy production instance reports', async () => {
    mongoose.connection.readyState = 1; // connected

    const res = await request(app).get('/api/v1/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('connected');
  });
});

describe('GET /api/v1/unknown-route', () => {
  it('returns 404 for unmatched routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
