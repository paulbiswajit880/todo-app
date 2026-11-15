import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { disconnectDB } from '../src/db.js';
import { Task } from '../src/models/Task.js';

let mongo;
let app;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('todo-test');
  app = createApp();
});

after(async () => {
  await disconnectDB();
  await mongo.stop();
});

beforeEach(async () => {
  // First request connects; afterwards clear the collection between tests.
  await request(app).get('/api/tasks');
  await Task.deleteMany({});
});

const create = (body) => request(app).post('/api/tasks').send(body);

describe('POST /api/tasks', () => {
  it('creates a task with defaults', async () => {
    const res = await create({ title: '  Buy milk ', dueAt: '2026-11-16T04:30:00.000Z' });
    assert.equal(res.status, 201);
    assert.equal(res.body.task.title, 'Buy milk');
    assert.equal(res.body.task.status, 'pending');
    assert.equal(res.body.task.priority, null);
    assert.equal(res.body.task.description, '');
    assert.ok(res.body.task.id);
    assert.equal(res.body.task._id, undefined);
  });

  it('requires a title and a valid date', async () => {
    const res = await create({ title: '   ', dueAt: 'not a date' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.title);
    assert.ok(res.body.details.dueAt);
  });

  it('rejects an unknown priority', async () => {
    const res = await create({ title: 'x', dueAt: '2026-11-16T04:30:00Z', priority: 'urgent' });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.priority);
  });

  it('ignores fields the client may not set', async () => {
    const res = await create({ title: 'x', dueAt: '2026-11-16T04:30:00Z', completedAt: '2020-01-01', _id: 'abc' });
    assert.equal(res.status, 201);
    assert.equal(res.body.task.completedAt, null);
  });

  it('answers malformed JSON with 400', async () => {
    const res = await request(app).post('/api/tasks').set('Content-Type', 'application/json').send('{bad');
    assert.equal(res.status, 400);
  });
});

describe('GET /api/tasks', () => {
  it('sorts by due date and filters by range', async () => {
    await create({ title: 'later', dueAt: '2026-11-20T10:00:00Z' });
    await create({ title: 'sooner', dueAt: '2026-11-17T10:00:00Z' });
    await create({ title: 'next month', dueAt: '2026-12-20T10:00:00Z' });

    const all = await request(app).get('/api/tasks');
    assert.deepEqual(all.body.tasks.map((t) => t.title), ['sooner', 'later', 'next month']);

    const week = await request(app).get('/api/tasks').query({ from: '2026-11-16T00:00:00Z', to: '2026-11-23T00:00:00Z' });
    assert.deepEqual(week.body.tasks.map((t) => t.title), ['sooner', 'later']);
  });

  it('searches title and description, case-insensitively and literally', async () => {
    await create({ title: 'Call the bank', dueAt: '2026-11-17T10:00:00Z' });
    await create({ title: 'Groceries', description: 'Milk, BANK holiday snacks', dueAt: '2026-11-18T10:00:00Z' });
    await create({ title: 'Price (approx.) check', dueAt: '2026-11-19T10:00:00Z' });

    const bank = await request(app).get('/api/tasks').query({ search: 'bank' });
    assert.equal(bank.body.tasks.length, 2);

    const literal = await request(app).get('/api/tasks').query({ search: '(approx.)' });
    assert.equal(literal.body.tasks.length, 1);

    const regexy = await request(app).get('/api/tasks').query({ search: '.*' });
    assert.equal(regexy.body.tasks.length, 0);
  });

  it('rejects a bad range date', async () => {
    const res = await request(app).get('/api/tasks').query({ from: 'yesterday-ish' });
    assert.equal(res.status, 400);
  });
});

describe('GET /api/tasks/weeks', () => {
  it('groups Monday to Sunday in the caller time zone', async () => {
    // Sunday 15 Nov 2026, 23:00 IST and Monday 16 Nov 2026, 00:30 IST:
    // the same UTC day, but different weeks in India.
    await create({ title: 'sunday night', dueAt: '2026-11-15T17:30:00Z' });
    const monday = await create({ title: 'monday early', dueAt: '2026-11-15T19:00:00Z' });
    await create({ title: 'monday later', dueAt: '2026-11-16T06:00:00Z' });
    await request(app).patch(`/api/tasks/${monday.body.task.id}`).send({ status: 'completed' });

    const res = await request(app).get('/api/tasks/weeks').query({ tz: 'Asia/Kolkata' });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.weeks, [
      { weekStart: '2026-11-08T18:30:00.000Z', weekEnd: '2026-11-15T18:30:00.000Z', total: 1, completed: 0, open: 1 },
      { weekStart: '2026-11-15T18:30:00.000Z', weekEnd: '2026-11-22T18:30:00.000Z', total: 2, completed: 1, open: 1 },
    ]);

    const utc = await request(app).get('/api/tasks/weeks').query({ tz: 'UTC' });
    assert.equal(utc.body.weeks.length, 2);
    assert.equal(utc.body.weeks[0].total, 2);
  });

  it('rejects an unknown time zone', async () => {
    const res = await request(app).get('/api/tasks/weeks').query({ tz: 'Mars/Olympus' });
    assert.equal(res.status, 400);
  });
});

describe('PATCH and DELETE /api/tasks/:id', () => {
  it('updates fields and tracks completion', async () => {
    const { body } = await create({ title: 'Draft', dueAt: '2026-11-17T10:00:00Z' });
    const id = body.task.id;

    const done = await request(app).patch(`/api/tasks/${id}`).send({ status: 'completed', priority: 'high' });
    assert.equal(done.status, 200);
    assert.equal(done.body.task.status, 'completed');
    assert.equal(done.body.task.priority, 'high');
    assert.ok(done.body.task.completedAt);

    const reopened = await request(app).patch(`/api/tasks/${id}`).send({ status: 'in_progress', title: 'Final' });
    assert.equal(reopened.body.task.completedAt, null);
    assert.equal(reopened.body.task.title, 'Final');
  });

  it('accepts an optional end time that must follow the start', async () => {
    const bad = await create({ title: 'x', dueAt: '2026-11-17T10:00:00Z', endAt: '2026-11-17T09:00:00Z' });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.details.endAt);

    const ok = await create({ title: 'x', dueAt: '2026-11-17T10:00:00Z', endAt: '2026-11-17T11:30:00Z' });
    assert.equal(ok.status, 201);
    assert.equal(ok.body.task.endAt, '2026-11-17T11:30:00.000Z');

    // Moving the start past the saved end is refused; clearing the end is allowed.
    const id = ok.body.task.id;
    assert.equal((await request(app).patch(`/api/tasks/${id}`).send({ dueAt: '2026-11-17T12:00:00Z' })).status, 400);
    const cleared = await request(app).patch(`/api/tasks/${id}`).send({ dueAt: '2026-11-17T12:00:00Z', endAt: null });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.body.task.endAt, null);
  });

  it('rejects an empty or invalid update', async () => {
    const { body } = await create({ title: 'x', dueAt: '2026-11-17T10:00:00Z' });
    assert.equal((await request(app).patch(`/api/tasks/${body.task.id}`).send({})).status, 400);
    assert.equal((await request(app).patch(`/api/tasks/${body.task.id}`).send({ title: '' })).status, 400);
    assert.equal((await request(app).patch(`/api/tasks/${body.task.id}`).send({ status: 'done' })).status, 400);
  });

  it('deletes, then answers 404', async () => {
    const { body } = await create({ title: 'x', dueAt: '2026-11-17T10:00:00Z' });
    assert.equal((await request(app).delete(`/api/tasks/${body.task.id}`)).status, 204);
    assert.equal((await request(app).get(`/api/tasks/${body.task.id}`)).status, 404);
    assert.equal((await request(app).delete(`/api/tasks/${body.task.id}`)).status, 404);
  });

  it('answers 404 for a malformed id', async () => {
    assert.equal((await request(app).get('/api/tasks/not-an-id')).status, 404);
  });
});
