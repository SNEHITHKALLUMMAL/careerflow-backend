import request from 'supertest';
import app from '../app.js';

describe('Recruiter routes — auth guard', () => {
  it('rejects GET /recruiters/me without a token', async () => {
    const res = await request(app).get('/api/v1/recruiters/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /recruiters/:id/verify without a token', async () => {
    const res = await request(app).patch('/api/v1/recruiters/507f1f77bcf86cd799439011/verify');
    expect(res.statusCode).toBe(401);
  });
});

describe('Job routes — auth guard', () => {
  it('rejects GET /jobs without a token', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /jobs without a token', async () => {
    const res = await request(app).post('/api/v1/jobs').send({ title: 'SWE' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /jobs/:id/apply without a token', async () => {
    const res = await request(app).post('/api/v1/jobs/507f1f77bcf86cd799439011/apply');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /jobs/:id/bookmark without a token', async () => {
    const res = await request(app).post('/api/v1/jobs/507f1f77bcf86cd799439011/bookmark');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /jobs/:id/applicants without a token', async () => {
    const res = await request(app).get('/api/v1/jobs/507f1f77bcf86cd799439011/applicants');
    expect(res.statusCode).toBe(401);
  });
});

describe('Internship routes — auth guard', () => {
  it('rejects GET /internships without a token', async () => {
    const res = await request(app).get('/api/v1/internships');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /internships without a token', async () => {
    const res = await request(app).post('/api/v1/internships').send({ title: 'Intern' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Application routes — auth guard', () => {
  it('rejects GET /applications/me without a token', async () => {
    const res = await request(app).get('/api/v1/applications/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /applications/:id/status without a token', async () => {
    const res = await request(app)
      .patch('/api/v1/applications/507f1f77bcf86cd799439011/status')
      .send({ status: 'shortlisted' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /applications/:id/schedule-interview without a token', async () => {
    const res = await request(app)
      .post('/api/v1/applications/507f1f77bcf86cd799439011/schedule-interview')
      .send({ scheduledAt: '2026-01-01T10:00:00.000Z', mode: 'online' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /applications/:id/offer-letter without a token', async () => {
    const res = await request(app)
      .post('/api/v1/applications/507f1f77bcf86cd799439011/offer-letter')
      .send({ position: 'SWE', startDate: '2026-06-01T00:00:00.000Z' });
    expect(res.statusCode).toBe(401);
  });
});
