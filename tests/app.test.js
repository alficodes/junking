const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
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
  test('GET / serves Dashboard HTML frontend', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('DevOps TaskFlow'));
    assert.ok(text.includes('Jenkins CI/CD Pipeline Simulator'));
  });

  test('GET /api/health returns 200 UP status and diagnostics', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'UP');
    assert.ok(typeof body.uptime === 'number');
    assert.ok(body.memory);
    assert.ok(body.nodeVersion);
  });

  test('GET /api/pipeline/info returns pipeline metadata', async () => {
    const res = await fetch(`${baseUrl}/api/pipeline/info`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.pipeline, 'jenkins-declarative');
    assert.ok(Array.isArray(body.stages));
  });

  test('GET /api/tasks returns task list with count', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.count > 0);
  });

  test('POST /api/tasks creates a task with category and priority', async () => {
    const payload = {
      title: 'Run Vulnerability Assessment',
      category: 'Security',
      priority: 'High'
    };

    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.title, 'Run Vulnerability Assessment');
    assert.equal(body.category, 'Security');
    assert.equal(body.priority, 'High');
    assert.equal(body.completed, false);
    assert.ok(typeof body.id === 'number');
  });

  test('POST /api/tasks rejects empty payload with 400', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  test('PATCH /api/tasks/:id/toggle toggles task completion', async () => {
    // Toggle task 1
    const res = await fetch(`${baseUrl}/api/tasks/1/toggle`, { method: 'PATCH' });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, 1);
    assert.equal(typeof body.completed, 'boolean');
  });

  test('DELETE /api/tasks/:id removes a task', async () => {
    // Create a temporary task to delete
    const createRes = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Temporary task for deletion' })
    });
    const created = await createRes.json();

    const deleteRes = await fetch(`${baseUrl}/api/tasks/${created.id}`, { method: 'DELETE' });
    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.removed.id, created.id);
  });
});
