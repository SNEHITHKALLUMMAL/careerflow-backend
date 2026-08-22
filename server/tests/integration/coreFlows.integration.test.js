import { jest } from '@jest/globals';
import request from 'supertest';

let mongod;
let mongoose;
let app;
let sendOtpEmailMock;

beforeAll(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  // Must be set before config/env.js (and anything that imports it) is ever loaded.
  process.env.MONGODB_URI = mongod.getUri();

  sendOtpEmailMock = jest.fn(async () => {});
  jest.unstable_mockModule('../../services/email.service.js', () => ({
    sendOtpEmail: sendOtpEmailMock,
  }));
  // Cloudinary uploads aren't exercised by these flows, but mock it defensively so an
  // accidental import never tries a real network call.
  jest.unstable_mockModule('../../utils/cloudinaryUpload.js', () => ({
    uploadBufferToCloudinary: jest.fn(async () => ({ secure_url: 'https://example.com/fake.pdf' })),
  }));

  const { connectDB } = await import('../../config/db.js');
  await connectDB();

  mongoose = (await import('mongoose')).default;
  app = (await import('../../app.js')).default;
}, 60000);

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  sendOtpEmailMock.mockClear();
});

function lastOtpSent() {
  return sendOtpEmailMock.mock.calls.at(-1)?.[0]?.otp;
}

async function registerAndVerifyStudent(email = 'test@example.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Test Student',
    email,
    password: 'password123',
    role: 'student',
  });
  const otp = lastOtpSent();
  const verifyRes = await request(app).post('/api/v1/auth/verify-email').send({ email, otp });
  return {
    accessToken: verifyRes.body.data.accessToken,
    refreshCookie: verifyRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken=')),
  };
}

describe('Auth flow (real MongoDB)', () => {
  it('registers, verifies with the real OTP, logs in, refreshes (rotating), and detects reuse', async () => {
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });
    expect(registerRes.statusCode).toBe(201);
    expect(sendOtpEmailMock).toHaveBeenCalledTimes(1);

    const otp = lastOtpSent();
    expect(otp).toMatch(/^\d{6}$/);

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'test@example.com', otp });
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.data.accessToken).toBeTruthy();

    // Duplicate registration is now rejected
    const dupRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Test Student',
      email: 'test@example.com',
      password: 'password123',
      role: 'student',
    });
    expect(dupRes.statusCode).toBe(409);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(loginRes.statusCode).toBe(200);
    const accessToken = loginRes.body.data.accessToken;
    const loginCookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(meRes.statusCode).toBe(200);
    expect(meRes.body.data.user.email).toBe('test@example.com');

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', loginCookie);
    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.body.data.accessToken).not.toBe(accessToken);

    // Reusing the now-rotated-out refresh token must be rejected (breach containment)
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', loginCookie);
    expect(reuseRes.statusCode).toBe(401);
  });

  it('rejects login before email verification', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Unverified User',
      email: 'unverified@example.com',
      password: 'password123',
      role: 'student',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'unverified@example.com', password: 'password123' });
    expect(loginRes.statusCode).toBe(403);
  });

  it('locks out email verification after 5 incorrect OTP attempts', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Otp Test',
      email: 'otptest@example.com',
      password: 'password123',
      role: 'student',
    });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ email: 'otptest@example.com', otp: '000000' });
      expect(res.statusCode).toBe(400);
    }

    const realOtp = lastOtpSent();
    const lockedRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'otptest@example.com', otp: realOtp });
    expect(lockedRes.statusCode).toBe(400);
    expect(lockedRes.body.message).toMatch(/too many/i);
  });

  it('resets a forgotten password with a real OTP and revokes existing sessions', async () => {
    const { refreshCookie } = await registerAndVerifyStudent('resetme@example.com');
    expect(refreshCookie).toBeTruthy();

    await request(app).post('/api/v1/auth/forgot-password').send({ email: 'resetme@example.com' });
    const resetOtp = lastOtpSent();

    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      email: 'resetme@example.com',
      otp: resetOtp,
      newPassword: 'newPassword123',
    });
    expect(resetRes.statusCode).toBe(200);

    // Old password no longer works
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resetme@example.com', password: 'password123' });
    expect(oldLoginRes.statusCode).toBe(401);

    // New password works
    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'resetme@example.com', password: 'newPassword123' });
    expect(newLoginRes.statusCode).toBe(200);

    // The refresh token issued before the reset must now be invalid (all sessions revoked)
    const oldRefreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', refreshCookie);
    expect(oldRefreshRes.statusCode).toBe(401);
  });
});

describe('Student profile CRUD (real MongoDB)', () => {
  it('lazily creates a profile on first access, then supports sub-resource CRUD', async () => {
    const { accessToken } = await registerAndVerifyStudent('profiletest@example.com');
    const auth = (req) => req.set('Authorization', `Bearer ${accessToken}`);

    const getRes = await auth(request(app).get('/api/v1/students/me'));
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.student.skills).toEqual([]);

    const addSkillRes = await auth(request(app).post('/api/v1/students/me/skills')).send({
      name: 'React',
      proficiency: 'advanced',
    });
    expect(addSkillRes.statusCode).toBe(201);
    const skillId = addSkillRes.body.data.item._id;

    const profileRes = await auth(request(app).get('/api/v1/students/me'));
    expect(profileRes.body.data.student.skills).toHaveLength(1);
    expect(profileRes.body.data.student.skills[0].name).toBe('React');

    const updateRes = await auth(request(app).patch(`/api/v1/students/me/skills/${skillId}`)).send({
      proficiency: 'intermediate',
    });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.item.proficiency).toBe('intermediate');

    const deleteRes = await auth(request(app).delete(`/api/v1/students/me/skills/${skillId}`));
    expect(deleteRes.statusCode).toBe(200);

    const finalRes = await auth(request(app).get('/api/v1/students/me'));
    expect(finalRes.body.data.student.skills).toEqual([]);
  });

  it('recalculates profile completion as sub-resources are added', async () => {
    const { accessToken } = await registerAndVerifyStudent('completiontest@example.com');
    const auth = (req) => req.set('Authorization', `Bearer ${accessToken}`);

    const before = await auth(request(app).get('/api/v1/students/me/completion'));
    expect(before.body.data.percent).toBe(0);

    await auth(request(app).post('/api/v1/students/me/education')).send({
      degree: 'B.Tech',
      institution: 'NIT Calicut',
      startYear: 2020,
    });

    const after = await auth(request(app).get('/api/v1/students/me/completion'));
    expect(after.body.data.percent).toBeGreaterThan(before.body.data.percent);
  });
});
