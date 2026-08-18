import request from 'supertest';
import app from '../app.js';

describe('Resume routes — auth guard', () => {
  it('rejects GET /resumes/history without a token', async () => {
    const res = await request(app).get('/api/v1/resumes/history');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /resumes/build without a token', async () => {
    const res = await request(app).post('/api/v1/resumes/build').send({ template: 'classic' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /resumes/:id without a token', async () => {
    const res = await request(app).get('/api/v1/resumes/507f1f77bcf86cd799439011');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /resumes/:id/ats-score without a token', async () => {
    const res = await request(app).get('/api/v1/resumes/507f1f77bcf86cd799439011/ats-score');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /resumes/:id/download without a token', async () => {
    const res = await request(app).get('/api/v1/resumes/507f1f77bcf86cd799439011/download');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /resumes/:id/rebuild without a token', async () => {
    const res = await request(app)
      .post('/api/v1/resumes/507f1f77bcf86cd799439011/rebuild')
      .send({});
    expect(res.statusCode).toBe(401);
  });
});
