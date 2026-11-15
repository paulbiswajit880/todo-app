import { useEffect, useState } from 'react';
import { api } from '../api/tasks.js';
import { formatWeekRange, weekLabel } from '../utils/dates.js';
import { ChevronDownIcon, PlusIcon } from './Icons.jsx';
import TaskItem from './TaskItem.jsx';

/** One week's summary card (open vs completed). Tapping it expands the week's tasks. */
export default function WeekCard({ week, expanded, onToggle, onAdd, actions, version }) {
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState('');
  const startMs = week.start.getTime();
  const endMs = week.end.getTime();

  useEffect(() => {
    if (!expanded) return undefined;
    let alive = true;
    api
      .list({ from: new Date(startMs).toISOString(), to: new Date(endMs).toISOString() })
      .then((data) => {
        if (!alive) return;
        setTasks(data.tasks);
        setError('');
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [expanded, startMs, endMs, version]);

  const label = weekLabel(week.start);
  const bodyId = `week-${startMs}`;

  return (
    <section
      className={`min-w-0 rounded border bg-white ${label === 'This Week' ? 'border-primary/40' : 'border-line'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        className="flex w-full items-center gap-3 rounded p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-muted">{formatWeekRange(week.start, week.end)}</p>
        </div>
        <div className="flex shrink-0 gap-1.5 text-center">
          <div className="min-w-[58px] rounded bg-danger-soft px-2 py-1">
            <p className="text-sm font-semibold text-danger">{week.open}</p>
            <p className="text-[10px] text-ink/70">Open</p>
          </div>
          <div className="min-w-[58px] rounded bg-primary-soft px-2 py-1">
            <p className="text-sm font-semibold text-primary">{week.completed}</p>
            <p className="text-[10px] text-ink/70">Completed</p>
          </div>
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div id={bodyId} className="border-t border-line px-3.5 pb-3">
          {error && <p className="py-3 text-sm text-danger">{error}</p>}
          {!error && tasks === null && <p className="py-3 text-sm text-muted">Loading tasks…</p>}
          {tasks?.length === 0 && <p className="py-3 text-sm text-muted">No tasks in this week.</p>}
          {tasks?.length > 0 && (
            <ul>
              {tasks.map((task) => (
                <TaskItem key={task.id} task={task} actions={actions} withDate surface="bg-white" />
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onAdd(week.start)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft"
          >
            <PlusIcon className="h-4 w-4" />
            Add task to this week
          </button>
        </div>
      )}
    </section>
  );
}
