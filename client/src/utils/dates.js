// All helpers work in the browser's local time zone, the same one the API is
// asked to group weeks by. Weeks run Monday to Sunday.

const fmt = (date, options) => new Intl.DateTimeFormat(undefined, options).format(date);

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  return d;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const isToday = (date) => sameDay(date, new Date());

/** "This Week", "Next Week", "Last Week" or "Week of 23 Nov". */
export function weekLabel(start) {
  const current = startOfWeek().getTime();
  const s = startOfWeek(start).getTime();
  if (s === current) return 'This Week';
  if (s === addDays(current, 7).getTime()) return 'Next Week';
  if (s === addDays(current, -7).getTime()) return 'Last Week';
  return `Week of ${fmt(start, { day: 'numeric', month: 'short' })}`;
}

export function formatWeekRange(start, end = addDays(start, 7)) {
  const last = new Date(end.getTime() - 1);
  const showYear = last.getFullYear() !== new Date().getFullYear();
  return `${fmt(start, { day: 'numeric', month: 'short' })} – ${fmt(last, {
    day: 'numeric',
    month: 'short',
    ...(showYear && { year: 'numeric' }),
  })}`;
}

export const weekdayShort = (d) => fmt(d, { weekday: 'short' });
export const dayNumber = (d) => String(d.getDate()).padStart(2, '0');
export const formatTime = (d) => fmt(d, { hour: 'numeric', minute: '2-digit' });

/** "Friday 14, January", as the Figma design writes dates. */
export function formatLongDate(d) {
  const showYear = d.getFullYear() !== new Date().getFullYear();
  return `${fmt(d, { weekday: 'long' })} ${d.getDate()}, ${fmt(d, { month: 'long' })}${showYear ? ` ${d.getFullYear()}` : ''}`;
}

/** "Wed 12 Nov" */
export function formatShortDate(d) {
  const showYear = d.getFullYear() !== new Date().getFullYear();
  return fmt(d, { weekday: 'short', day: 'numeric', month: 'short', ...(showYear && { year: 'numeric' }) });
}

const pad = (n) => String(n).padStart(2, '0');
export const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "2026-11-16" + "09:30", read as local time. */
export function fromInputs(date, time) {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Default start for a new task on a given day: the next full hour when the day
 * is today, otherwise 09:00 that day.
 */
export function defaultStart(day = new Date()) {
  if (isToday(day)) {
    const next = new Date();
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    return next;
  }
  const d = startOfDay(day);
  d.setHours(9);
  return d;
}

/** The day a new task in a given week should default to: today if it is in that week, else Monday. */
export function defaultDayInWeek(weekStart) {
  const today = new Date();
  return today >= weekStart && today < addDays(weekStart, 7) ? today : weekStart;
}
