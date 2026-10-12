const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  // Start server on an ephemeral random open port
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Jenkins CI/CD Pipeline Automated Tests', () => {
  test('GET / returns 200 and API status online', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'online');
    assert.equal(body.version, '1.0.0');
  });

  test('GET /api/health returns 200 UP status (Smoke / Health Check)', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.ok(typeof body.uptime === 'number');
    assert.ok(typeof body.timestamp === 'string');
  });

  test('GET /api/tasks returns task list', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.equal(body.count, body.data.length);
  });

  test('POST /api/tasks creates a new task successfully', async () => {
    const payload = { title: 'Configure Jenkins Webhook' };
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.title, 'Configure Jenkins Webhook');
    assert.equal(body.completed, false);
    assert.ok(typeof body.id === 'number');
  });

  test('POST /api/tasks rejects empty or invalid payload with 400', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });
});
