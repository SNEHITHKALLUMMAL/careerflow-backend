import request from 'supertest';
import app from '../app.js';

describe('Student routes — auth guard', () => {
  it('rejects GET /students/me without a token', async () => {
    const res = await request(app).get('/api/v1/students/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects PATCH /students/me without a token', async () => {
    const res = await request(app).patch('/api/v1/students/me').send({ rollNumber: 'CS21B045' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /students/me/skills without a token', async () => {
    const res = await request(app).post('/api/v1/students/me/skills').send({ name: 'JavaScript' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects DELETE /students/me/projects/:itemId without a token', async () => {
    const res = await request(app).delete('/api/v1/students/me/projects/507f1f77bcf86cd799439011');
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /students/me/resume without a token', async () => {
    const res = await request(app).post('/api/v1/students/me/resume');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/colleges', () => {
  it('rejects an invalid page query param before touching the database', async () => {
    const res = await request(app).get('/api/v1/colleges?page=0');
    expect(res.statusCode).toBe(400);
  });
});
