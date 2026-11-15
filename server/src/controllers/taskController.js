import mongoose from 'mongoose';
import { STATUSES, Task } from '../models/Task.js';
import { HttpError } from '../middleware/errors.js';
import { isValidTimeZone, parseDate, validateTask } from '../validation.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function findTaskOr404(id) {
  const task = mongoose.isValidObjectId(id) ? await Task.findById(id) : null;
  if (!task) throw new HttpError(404, 'Task not found');
  return task;
}

/** GET /tasks?search=&from=&to=&status=&limit= */
export async function listTasks(req, res) {
  const { search, from, to, status } = req.query;
  const filter = {};

  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim().slice(0, 100)), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }

  if (from !== undefined || to !== undefined) {
    filter.dueAt = {};
    if (from !== undefined) {
      const d = parseDate(from);
      if (!d) throw new HttpError(400, '`from` must be a valid date');
      filter.dueAt.$gte = d;
    }
    if (to !== undefined) {
      const d = parseDate(to);
      if (!d) throw new HttpError(400, '`to` must be a valid date');
      filter.dueAt.$lt = d;
    }
  }

  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);
    filter.status = status;
  }

  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 200, 1), 500);
  const tasks = await Task.find(filter).sort({ dueAt: 1, createdAt: 1 }).limit(limit);
  res.json({ tasks });
}

/**
 * GET /tasks/weeks?tz=Asia/Kolkata
 * One row per week (Monday 00:00 to the next Monday 00:00 in the caller's time
 * zone) that has tasks, with open and completed counts.
 */
export async function weekSummaries(req, res) {
  const tz = req.query.tz ?? 'UTC';
  if (!isValidTimeZone(tz)) throw new HttpError(400, '`tz` must be a valid IANA time zone, e.g. Asia/Kolkata');

  const weeks = await Task.aggregate([
    {
      $group: {
        _id: { $dateTrunc: { date: '$dueAt', unit: 'week', startOfWeek: 'monday', timezone: tz } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        weekStart: '$_id',
        weekEnd: { $dateAdd: { startDate: '$_id', unit: 'week', amount: 1, timezone: tz } },
        total: 1,
        completed: 1,
        open: { $subtract: ['$total', '$completed'] },
      },
    },
  ]);

  res.json({ timeZone: tz, weeks });
}

/** GET /tasks/:id */
export async function getTask(req, res) {
  res.json({ task: await findTaskOr404(req.params.id) });
}

/** POST /tasks */
export async function createTask(req, res) {
  const { value, errors } = validateTask(req.body);
  if (errors) throw new HttpError(400, 'Validation failed', errors);
  if (value.status === 'completed') value.completedAt = new Date();
  const task = await Task.create(value);
  res.status(201).location(`${req.baseUrl}/${task.id}`).json({ task });
}

/** PATCH /tasks/:id (any subset of title, description, dueAt, priority, status) */
export async function updateTask(req, res) {
  const { value, errors } = validateTask(req.body, { partial: true });
  if (errors) throw new HttpError(400, 'Validation failed', errors);

  const task = await findTaskOr404(req.params.id);
  const start = value.dueAt ?? task.dueAt;
  const end = 'endAt' in value ? value.endAt : task.endAt;
  if (end && end <= start) {
    throw new HttpError(400, 'Validation failed', { endAt: 'End time must be after the start time' });
  }
  if (value.status && value.status !== task.status) {
    task.completedAt = value.status === 'completed' ? new Date() : null;
  }
  task.set(value);
  await task.save();
  res.json({ task });
}

/** DELETE /tasks/:id */
export async function deleteTask(req, res) {
  const task = await findTaskOr404(req.params.id);
  await task.deleteOne();
  res.status(204).end();
}
