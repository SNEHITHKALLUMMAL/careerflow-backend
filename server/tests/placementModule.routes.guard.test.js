import request from 'supertest';
import app from '../app.js';

describe('Notification routes — auth guard', () => {
  it('rejects GET /notifications/me without a token', async () => {
    const res = await request(app).get('/api/v1/notifications/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /notifications without a token', async () => {
    const res = await request(app).post('/api/v1/notifications').send({ title: 'x', message: 'y' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Drive routes — auth guard', () => {
  it('rejects GET /drives without a token', async () => {
    const res = await request(app).get('/api/v1/drives');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /drives without a token', async () => {
    const res = await request(app)
      .post('/api/v1/drives')
      .send({ jobId: '507f1f77bcf86cd799439011', driveDate: '2026-06-01T00:00:00.000Z' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /drives/:id/eligible-students without a token', async () => {
    const res = await request(app).get('/api/v1/drives/507f1f77bcf86cd799439011/eligible-students');
    expect(res.statusCode).toBe(401);
  });
});

describe('Placement routes — auth guard', () => {
  it('rejects GET /placement/analytics without a token', async () => {
    const res = await request(app).get('/api/v1/placement/analytics');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /placement/students without a token', async () => {
    const res = await request(app).get('/api/v1/placement/students');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /placement/recruiters without a token', async () => {
    const res = await request(app).get('/api/v1/placement/recruiters');
    expect(res.statusCode).toBe(401);
  });
});
