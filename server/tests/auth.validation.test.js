import request from 'supertest';
import app from '../app.js';

describe('POST /api/v1/auth/register — validation', () => {
  it('rejects a request missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password', 'role']));
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha Verma',
      email: 'asha@example.com',
      password: 'short',
      role: 'student',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  it('rejects a role that is not self-registerable', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Asha Verma',
      email: 'asha@example.com',
      password: 'password123',
      role: 'superAdmin',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'role')).toBe(true);
  });
});

describe('POST /api/v1/auth/login — validation', () => {
  it('rejects an invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'email')).toBe(true);
  });
});

describe('POST /api/v1/auth/reset-password — validation', () => {
  it('rejects a malformed OTP', async () => {
    const res = await request(app).post('/api/v1/auth/reset-password').send({
      email: 'asha@example.com',
      otp: '12',
      newPassword: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'otp')).toBe(true);
  });
});

describe('GET /api/v1/auth/me — auth guard', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('rejects a request with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.statusCode).toBe(401);
  });
});
