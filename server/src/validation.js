import { LIMITS, PRIORITIES, STATUSES } from './models/Task.js';

export function parseDate(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  if (typeof input === 'string' && !input.trim()) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a task payload. With `partial`, only the fields present are checked
 * (used for PATCH); otherwise title and dueAt are required (used for POST).
 * Unknown fields are ignored, so clients cannot set ids, timestamps or completedAt.
 */
export function validateTask(body, { partial = false } = {}) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object' } };
  }

  const errors = {};
  const value = {};

  if (!partial || 'title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) errors.title = 'Title is required';
    else if (title.length > LIMITS.title) errors.title = `Title must be at most ${LIMITS.title} characters`;
    else value.title = title;
  }

  if ('description' in body) {
    const { description } = body;
    if (description === null || description === undefined) value.description = '';
    else if (typeof description !== 'string') errors.description = 'Description must be text';
    else if (description.trim().length > LIMITS.description) {
      errors.description = `Description must be at most ${LIMITS.description} characters`;
    } else value.description = description.trim();
  }

  if (!partial || 'dueAt' in body) {
    const dueAt = parseDate(body.dueAt);
    if (!dueAt) errors.dueAt = 'Date & time is required and must be a valid date';
    else value.dueAt = dueAt;
  }

  if ('endAt' in body) {
    if (body.endAt === null || body.endAt === undefined || body.endAt === '') value.endAt = null;
    else {
      const endAt = parseDate(body.endAt);
      if (!endAt) errors.endAt = 'End time must be a valid date';
      else value.endAt = endAt;
    }
  }

  if ('priority' in body) {
    const { priority } = body;
    if (priority === null || priority === undefined || priority === '') value.priority = null;
    else if (!PRIORITIES.includes(priority)) errors.priority = `Priority must be one of: ${PRIORITIES.join(', ')}`;
    else value.priority = priority;
  }

  if ('status' in body) {
    if (!STATUSES.includes(body.status)) errors.status = `Status must be one of: ${STATUSES.join(', ')}`;
    else value.status = body.status;
  }

  if (!partial && value.endAt && value.dueAt && value.endAt <= value.dueAt) {
    errors.endAt = 'End time must be after the start time';
  }

  if (partial && !Object.keys(errors).length && !Object.keys(value).length) {
    errors.body = 'Nothing to update';
  }

  return Object.keys(errors).length ? { errors } : { value };
}
