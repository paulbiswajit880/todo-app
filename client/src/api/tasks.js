// VITE_API_URL is only needed when the API is hosted on another domain.
const BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { body, ...options } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.details);
  return data;
}

export const api = {
  weeks: () => request(`/tasks/weeks?tz=${encodeURIComponent(timeZone)}`),
  list: (params = {}) => request(`/tasks?${new URLSearchParams(params)}`),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};
