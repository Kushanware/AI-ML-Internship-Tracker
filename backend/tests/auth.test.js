const request = require('supertest');
const app = require('../app');

describe('Auth flow', () => {
  it('registers and logs in a user', async () => {
    const email = `user${Date.now()}@test.com`;
    const register = await request(app)
      .post('/auth/register')
      .send({ name: 'Tester', email, password: 'secret123' });
    expect(register.status).toBe(201);
    expect(register.body.user.email).toBe(email);

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password: 'secret123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();
  });
});