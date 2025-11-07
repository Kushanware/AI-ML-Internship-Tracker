const request = require('supertest');
const app = require('../app');

describe('Internships', () => {
  it('creates and lists internships', async () => {
    const create = await request(app)
      .post('/internships')
      .send({ title: 'AI Intern', company: 'Acme', sourceUrl: 'https://example.com/X' });
    expect([200, 201]).toContain(create.status);

    const list = await request(app).get('/internships');
    expect(list.status).toBe(200);
    expect(list.body.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(list.body.data)).toBe(true);
  });
});