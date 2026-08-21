import request from 'supertest';
import app from '../app.js';

describe('Employability routes — auth guard', () => {
  it('rejects GET /employability/me without a token', async () => {
    const res = await request(app).get('/api/v1/employability/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Report routes — auth guard', () => {
  it('rejects POST /reports/generate without a token', async () => {
    const res = await request(app)
      .post('/api/v1/reports/generate')
      .send({ scope: 'student_weekly' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /reports/me without a token', async () => {
    const res = await request(app).get('/api/v1/reports/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Career analytics route — auth guard', () => {
  it('rejects GET /placement/career-analytics without a token', async () => {
    const res = await request(app).get('/api/v1/placement/career-analytics');
    expect(res.statusCode).toBe(401);
  });
});
