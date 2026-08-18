import request from 'supertest';
import app from '../app.js';

describe('GET /api/v1/health', () => {
  it('returns 200 with an ok status payload', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('GET /api/v1/unknown-route', () => {
  it('returns 404 for unmatched routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
