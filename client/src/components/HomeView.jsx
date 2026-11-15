import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/tasks.js';
import { addDays, formatShortDate, isToday, sameDay, startOfWeek, weekLabel } from '../utils/dates.js';
import { CheckSquareIcon, SearchIcon, XSquareIcon } from './Icons.jsx';
import TaskItem from './TaskItem.jsx';
import WeekCard from './WeekCard.jsx';
import WeekStrip from './WeekStrip.jsx';

const pad2 = (n) => String(n).padStart(2, '0');

/** API week rows → Date objects, with the current week always present. */
function prepareWeeks(rows) {
  const weeks = rows.map((w) => ({ ...w, start: new Date(w.weekStart), end: new Date(w.weekEnd) }));
  const current = startOfWeek();
  if (!weeks.some((w) => w.start.getTime() === current.getTime())) {
    weeks.push({ start: current, end: addDays(current, 7), total: 0, open: 0, completed: 0 });
  }
  return weeks.sort((a, b) => a.start - b.start);
}

function StatCard({ tone, icon: Icon, label, value, caption }) {
  const styles =
    tone === 'blue'
      ? { card: 'bg-primary-soft', icon: 'bg-primary-light/70 text-primary' }
      : { card: 'bg-danger-soft', icon: 'bg-danger/15 text-danger' };
  return (
    <div className={`rounded p-3 ${styles.card}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${styles.icon}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-xs font-medium leading-tight text-ink">{label}</span>
      </div>
      <p className="mt-1.5 flex items-baseline gap-1 whitespace-nowrap min-[360px]:pl-9">
        <span className="text-xl font-semibold text-ink">{pad2(value)}</span>
        <span className="truncate text-[10px] text-muted">{caption}</span>
      </p>
    </div>
  );
}

export default function HomeView({ version, actions, onSearch, onAdd, onDayChange }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [showAll, setShowAll] = useState(false);
  const [weekTasks, setWeekTasks] = useState(null);
  const [weeks, setWeeks] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [error, setError] = useState('');
  const weekMs = weekStart.getTime();

  useEffect(() => {
    onDayChange?.(selectedDay);
  }, [selectedDay, onDayChange]);

  // Tasks of the week shown in the strip.
  useEffect(() => {
    let alive = true;
    api
      .list({ from: new Date(weekMs).toISOString(), to: addDays(new Date(weekMs), 7).toISOString() })
      .then((data) => {
        if (!alive) return;
        setWeekTasks(data.tasks);
        setError('');
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [weekMs, version]);

  // Open/completed summary for every week.
  useEffect(() => {
    let alive = true;
    api
      .weeks()
      .then((data) => alive && setWeeks(prepareWeeks(data.weeks)))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [version]);

  const stats = useMemo(() => {
    const list = weekTasks ?? [];
    const completed = list.filter((t) => t.status === 'completed').length;
    return { total: list.length, completed, pending: list.length - completed };
  }, [weekTasks]);

  const taskDays = useMemo(
    () => new Set((weekTasks ?? []).map((t) => new Date(t.dueAt).toDateString())),
    [weekTasks],
  );

  const visible = (weekTasks ?? []).filter((t) => showAll || sameDay(new Date(t.dueAt), selectedDay));
  const progress = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const caption = weekLabel(weekStart);
  const listTitle = showAll ? `Tasks ${caption}` : isToday(selectedDay) ? 'Tasks Today' : `Tasks on ${formatShortDate(selectedDay)}`;

  function changeWeek(delta) {
    setWeekStart((w) => addDays(w, 7 * delta));
    setSelectedDay((d) => addDays(d, 7 * delta));
  }

  const toggleWeek = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="pt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:pt-8">
      <div className="min-w-0">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-12 w-full items-center justify-between rounded border border-line bg-white px-3.5 text-left text-sm text-muted hover:border-primary/50"
        >
          Search for a task
          <SearchIcon className="h-5 w-5 text-ink" />
        </button>

        <div className="mt-5">
          <WeekStrip
            weekStart={weekStart}
            selectedDay={selectedDay}
            taskDays={taskDays}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setShowAll(false);
            }}
            onChangeWeek={changeWeek}
          />
        </div>

        {error && <p className="mt-4 rounded bg-danger-soft p-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard tone="blue" icon={CheckSquareIcon} label="Task Complete" value={stats.completed} caption={caption} />
          <StatCard tone="red" icon={XSquareIcon} label="Task Pending" value={stats.pending} caption={caption} />
        </div>

        <section className="mt-6">
          <h2 className="text-base font-semibold text-ink">Weekly Progress</h2>
          <div
            className="mt-3 h-4 overflow-hidden rounded-sm bg-primary-light"
            role="progressbar"
            aria-label="Weekly progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-primary-dark transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {stats.completed} of {stats.total} {stats.total === 1 ? 'task' : 'tasks'} completed
          </p>
        </section>

        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">{listTitle}</h2>
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              {showAll ? 'Show Day' : 'View All'}
            </button>
          </div>
          {weekTasks === null && !error && <p className="py-4 text-sm text-muted">Loading…</p>}
          {weekTasks !== null && visible.length === 0 && (
            <p className="border-b border-line py-5 text-sm text-muted">
              {showAll ? 'No tasks in this week yet.' : 'Nothing planned for this day.'}
            </p>
          )}
          {visible.length > 0 && (
            <ul className="mt-1">
              {visible.map((task) => (
                <TaskItem key={task.id} task={task} actions={actions} withDate={showAll} />
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-muted">Tip: swipe a task left, or tap its bin, to delete it.</p>
        </section>
      </div>

      <section className="mt-8 min-w-0 lg:mt-0">
        <h2 className="text-base font-semibold text-ink">All Weeks</h2>
        <p className="mt-0.5 text-xs text-muted">Monday to Sunday. Tap a week to see its tasks.</p>
        {!weeks && !error && (
          <div className="mt-3 space-y-2" aria-label="Loading weeks">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-white" />
            ))}
          </div>
        )}
        {weeks && (
          <div className="mt-3 space-y-2">
            {weeks.map((week) => {
              const key = week.start.getTime();
              return (
                <WeekCard
                  key={key}
                  week={week}
                  expanded={expanded.has(key)}
                  onToggle={() => toggleWeek(key)}
                  onAdd={onAdd}
                  actions={actions}
                  version={version}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
