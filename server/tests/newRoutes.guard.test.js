import request from 'supertest';
import app from '../app.js';

describe('College Admin routes — auth guard', () => {
  it('rejects GET /college-admin/overview without a token', async () => {
    const res = await request(app).get('/api/v1/college-admin/overview');
    expect(res.statusCode).toBe(401);
  });

  it('rejects GET /college-admin/users without a token', async () => {
    const res = await request(app).get('/api/v1/college-admin/users');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /college-admin/users/:id/status without a token', async () => {
    const res = await request(app)
      .patch('/api/v1/college-admin/users/507f1f77bcf86cd799439011/status')
      .send({ isActive: false });
    expect(res.statusCode).toBe(401);
  });
});

describe('College request/approval routes — auth guard', () => {
  it('allows POST /colleges/request without a token — deliberately public', async () => {
    const res = await request(app)
      .post('/api/v1/colleges/request')
      .send({ name: '' }); // invalid payload — but the point is it's NOT a 401
    expect(res.statusCode).not.toBe(401);
    expect(res.statusCode).toBe(400); // rejected by the validator instead, as expected
  });

  it('rejects GET /colleges/pending without a token', async () => {
    const res = await request(app).get('/api/v1/colleges/pending');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /colleges/:id/approve without a token', async () => {
    const res = await request(app).patch('/api/v1/colleges/507f1f77bcf86cd799439011/approve');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /colleges/:id/reject without a token', async () => {
    const res = await request(app).patch('/api/v1/colleges/507f1f77bcf86cd799439011/reject');
    expect(res.statusCode).toBe(401);
  });
});

describe('Role management route — auth guard', () => {
  it('rejects PATCH /admin/users/:id/role without a token', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/users/507f1f77bcf86cd799439011/role')
      .send({ role: 'mentor' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects an invalid role value before touching auth or the database', async () => {
    // No token AND an invalid body — auth is checked first, so this still 401s
    // rather than 400ing on the invalid role; this pins that ordering.
    const res = await request(app)
      .patch('/api/v1/admin/users/507f1f77bcf86cd799439011/role')
      .send({ role: 'not-a-real-role' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Department management routes — auth guard', () => {
  it('rejects POST /departments without a token', async () => {
    const res = await request(app).post('/api/v1/departments').send({ name: 'CS' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /departments/:id without a token', async () => {
    const res = await request(app)
      .patch('/api/v1/departments/507f1f77bcf86cd799439011')
      .send({ name: 'CS' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects DELETE /departments/:id without a token', async () => {
    const res = await request(app).delete('/api/v1/departments/507f1f77bcf86cd799439011');
    expect(res.statusCode).toBe(401);
  });
});

describe('Assessment attempts (grading queue) route — auth guard', () => {
  it('rejects GET /assessments/:id/attempts without a token', async () => {
    const res = await request(app).get('/api/v1/assessments/507f1f77bcf86cd799439011/attempts');
    expect(res.statusCode).toBe(401);
  });
});
