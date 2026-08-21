import request from 'supertest';
import app from '../app.js';

describe('Assessment routes — auth guard', () => {
  it('rejects GET /assessments without a token', async () => {
    const res = await request(app).get('/api/v1/assessments');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /assessments without a token', async () => {
    const res = await request(app).post('/api/v1/assessments').send({ title: 'Test' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /assessments/:id/attempt/start without a token', async () => {
    const res = await request(app).post(
      '/api/v1/assessments/507f1f77bcf86cd799439011/attempt/start'
    );
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /assessments/:id/attempt/submit without a token', async () => {
    const res = await request(app)
      .post('/api/v1/assessments/507f1f77bcf86cd799439011/attempt/submit')
      .send({ answers: [] });
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /assessments/:id/attempts/:attemptId/grade without a token', async () => {
    const res = await request(app)
      .patch('/api/v1/assessments/507f1f77bcf86cd799439011/attempts/507f1f77bcf86cd799439012/grade')
      .send({ answers: [] });
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /assessments/:id/leaderboard without a token', async () => {
    const res = await request(app).get('/api/v1/assessments/507f1f77bcf86cd799439011/leaderboard');
    expect(res.statusCode).toBe(401);
  });
});

describe('Certificate routes — auth guard', () => {
  it('rejects GET /certificates/me without a token', async () => {
    const res = await request(app).get('/api/v1/certificates/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /certificates/:id/download without a token', async () => {
    const res = await request(app).get('/api/v1/certificates/507f1f77bcf86cd799439011/download');
    expect(res.statusCode).toBe(401);
  });
});
