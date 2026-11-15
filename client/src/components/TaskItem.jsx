import { useRef, useState } from 'react';
import { formatShortDate, formatTime } from '../utils/dates.js';
import { PRIORITY_TEXT, isOverdue } from '../utils/task.js';
import { CheckIcon, ClockIcon, EditIcon, TrashIcon } from './Icons.jsx';

const REVEAL = 84; // width of the red Delete button revealed by a swipe

/**
 * A task row as in the Figma "Tasks Today" list: square checkbox, title, then
 * trash and edit icons. Tap the row to view/edit it, swipe left (touch or mouse
 * drag) to reveal Delete, tick the box to complete it.
 */
export default function TaskItem({ task, actions, withDate = false, surface = 'bg-canvas' }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);
  const drag = useRef(null);
  const suppressClick = useRef(false);

  const moveTo = (value) => {
    offsetRef.current = value;
    setOffset(value);
  };

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    suppressClick.current = false;
    drag.current = { x: e.clientX, y: e.clientY, base: offsetRef.current, active: false };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // vertical scroll, not a swipe
        return;
      }
      if (Math.abs(dx) < 8) return;
      d.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    moveTo(Math.max(-REVEAL - 32, Math.min(0, d.base + dx)));
  }

  function onPointerEnd() {
    const d = drag.current;
    drag.current = null;
    if (!d?.active) return;
    suppressClick.current = true;
    setDragging(false);
    moveTo(offsetRef.current < -REVEAL / 2 ? -REVEAL : 0);
  }

  function onRowClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (offsetRef.current !== 0) moveTo(0);
    else actions.edit(task);
  }

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  const done = task.status === 'completed';
  const overdue = isOverdue(task);
  const start = new Date(task.dueAt);
  const time = task.endAt ? `${formatTime(start)} – ${formatTime(new Date(task.endAt))}` : formatTime(start);

  return (
    <li className="relative overflow-hidden">
      <button
        type="button"
        onClick={() => actions.remove(task)}
        tabIndex={offset ? 0 : -1}
        aria-hidden={!offset}
        className={`absolute inset-y-0 right-0 flex w-[84px] flex-col items-center justify-center gap-0.5 bg-danger text-xs font-medium text-white transition-opacity ${
          offset ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <TrashIcon className="h-5 w-5" />
        Delete
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={onRowClick}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative flex touch-pan-y select-none items-start gap-3 border-b border-line py-3.5 ${surface} ${
          dragging ? '' : 'transition-transform duration-200 ease-out'
        }`}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={stop(() => actions.setStatus(task, done ? 'pending' : 'completed'))}
          aria-label={`Mark "${task.title}" as ${done ? 'not done' : 'completed'}`}
          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-primary transition-colors ${
            done ? 'bg-primary-soft text-primary' : 'bg-white hover:bg-primary-soft'
          }`}
        >
          {done && <CheckIcon className="h-3 w-3" />}
        </button>

        <button type="button" className="min-w-0 flex-1 text-left focus:outline-none" aria-label={`Open task "${task.title}"`}>
          <p
            className={`line-clamp-2 break-words text-sm font-medium leading-snug ${
              done ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {task.title}
          </p>
          {task.description && <p className="mt-0.5 truncate text-xs text-muted">{task.description}</p>}
          <p className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] ${overdue ? 'text-danger' : 'text-muted'}`}>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {withDate && `${formatShortDate(start)} · `}
              {time}
            </span>
            {overdue && <span className="font-medium">Overdue</span>}
            {task.status === 'in_progress' && <span className="font-medium text-primary">In progress</span>}
            {task.priority && (
              <span className={`inline-flex items-center gap-1 font-medium capitalize ${PRIORITY_TEXT[task.priority]}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {task.priority}
              </span>
            )}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-1 text-[#B4B4BB]">
          <button
            type="button"
            onClick={stop(() => actions.remove(task))}
            aria-label={`Delete "${task.title}"`}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-danger-soft hover:text-danger"
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            onClick={stop(() => actions.edit(task))}
            aria-label={`Edit "${task.title}"`}
            className="flex h-8 w-8 items-center justify-center rounded hover:bg-primary-soft hover:text-primary"
          >
            <EditIcon />
          </button>
        </div>
      </div>
    </li>
  );
}
