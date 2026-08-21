import request from 'supertest';
import app from '../app.js';

describe('AI routes — auth guard', () => {
  it('rejects POST /ai/skill-gap without a token', async () => {
    const res = await request(app)
      .post('/api/v1/ai/skill-gap')
      .send({ targetRole: 'Backend Developer' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /ai/chatbot without a token', async () => {
    const res = await request(app).post('/api/v1/ai/chatbot').send({ message: 'Hi' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /ai/mock-interview/start without a token', async () => {
    const res = await request(app)
      .post('/api/v1/ai/mock-interview/start')
      .send({ targetRole: 'Backend Developer' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects POST /ai/career-recommendation (no body needed) without a token', async () => {
    const res = await request(app).post('/api/v1/ai/career-recommendation');
    expect(res.statusCode).toBe(401);
  });
});
