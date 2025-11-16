const request = require('supertest');
const createApp = require('../app');

jest.setTimeout(20000);

let app;

beforeAll(() => {
  app = createApp();
});

async function loginAsAvery() {
  const response = await request(app).post('/api/login').send({
    email: 'avery.hart@example.com',
    password: 'athlete123',
  });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('token');
  expect(response.body).toHaveProperty('user');

  return response.body;
}

describe('Health check', () => {
  it('returns an ok payload with timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok' });
    expect(typeof response.body.timestamp).toBe('string');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});

describe('Authentication flow', () => {
  it('logs in a seeded athlete by email and password', async () => {
    const { token, user } = await loginAsAvery();

    expect(typeof token).toBe('string');
    expect(user).toMatchObject({
      email: 'avery.hart@example.com',
      name: 'Avery Hart',
      role: 'Coach',
    });
  });
});

describe('Metrics endpoint', () => {
  it('returns readiness data for the authenticated user', async () => {
    const { token } = await loginAsAvery();
    const response = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('subject');
    expect(response.body.subject).toMatchObject({
      name: 'Avery Hart',
      email: 'avery.hart@example.com',
    });
    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary).toHaveProperty('steps');
    expect(Array.isArray(response.body.timeline)).toBe(true);
    expect(Array.isArray(response.body.readiness)).toBe(true);
    expect(response.body.readiness.length).toBeGreaterThan(0);
  });
});

describe('Sensor stream ingestion', () => {
  it('accepts batched samples and returns downsampled data', async () => {
    const { token } = await loginAsAvery();
    const now = Date.now();
    const samples = Array.from({ length: 120 }, (_, index) => ({
      timestamp: now - index * 1000,
      value: 120 + index,
    }));

    const ingest = await request(app)
      .post('/api/streams')
      .set('Authorization', `Bearer ${token}`)
      .send({ metric: 'heart_rate', samples });

    expect(ingest.status).toBe(202);
    expect(ingest.body).toMatchObject({ metric: 'heart_rate' });
    expect(ingest.body.accepted).toBe(samples.length);

    const lookbackStart = now - 60 * 1000;
    const response = await request(app)
      .get(`/api/streams?metric=heart_rate&from=${lookbackStart}&to=${now}&maxPoints=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.metric).toBe('heart_rate');
    expect(response.body.points.length).toBeLessThanOrEqual(10);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.points[0]).toHaveProperty('ts');
  });
});
