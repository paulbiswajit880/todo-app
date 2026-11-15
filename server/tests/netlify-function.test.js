// Calls the Netlify Function handler the way Netlify does, with both path forms
// the /api/* rewrite can produce.
import assert from 'node:assert/strict';
import { after, before, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectDB } from '../src/db.js';

let mongo;
let handler;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('todo-fn-test');
  ({ handler } = await import('../../netlify/functions/api.js'));
});

after(async () => {
  await disconnectDB();
  await mongo.stop();
});

const call = (httpMethod, path, body) =>
  handler(
    {
      httpMethod,
      path,
      rawUrl: `https://example.netlify.app${path}`,
      headers: { 'content-type': 'application/json', host: 'example.netlify.app' },
      queryStringParameters: {},
      multiValueQueryStringParameters: {},
      body: body ? JSON.stringify(body) : null,
      isBase64Encoded: false,
    },
    { callbackWaitsForEmptyEventLoop: true },
  );

it('serves the API through the function under both paths', async () => {
  const created = await call('POST', '/api/tasks', { title: 'From function', dueAt: '2026-11-17T10:00:00Z' });
  assert.equal(created.statusCode, 201);
  assert.equal(JSON.parse(created.body).task.title, 'From function');

  const listed = await call('GET', '/.netlify/functions/api/tasks');
  assert.equal(listed.statusCode, 200);
  assert.equal(JSON.parse(listed.body).tasks.length, 1);

  const health = await call('GET', '/api/health');
  assert.equal(health.statusCode, 200);
});
