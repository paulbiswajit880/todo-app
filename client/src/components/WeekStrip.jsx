import { addDays, dayNumber, formatWeekRange, isToday, sameDay, weekLabel, weekdayShort } from '../utils/dates.js';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx';

/** Monday-to-Sunday day picker with week arrows, as in the Figma home screen. */
export default function WeekStrip({ weekStart, selectedDay, taskDays, onSelectDay, onChangeWeek }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeWeek(-1)}
          aria-label="Previous week"
          className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-white hover:text-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-sm text-ink">
          <span className="font-semibold">{weekLabel(weekStart)}</span>
          <span className="text-muted"> · {formatWeekRange(weekStart)}</span>
        </p>
        <button
          type="button"
          onClick={() => onChangeWeek(1)}
          aria-label="Next week"
          className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-white hover:text-ink"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1" role="group" aria-label="Days of the week">
        {days.map((day) => {
          const selected = sameDay(day, selectedDay);
          const hasTasks = taskDays.has(day.toDateString());
          return (
            <button
              key={day.toDateString()}
              type="button"
              onClick={() => onSelectDay(day)}
              aria-pressed={selected}
              aria-label={`${day.toDateString()}${hasTasks ? ', has tasks' : ''}`}
              className={`flex flex-col items-center rounded py-2 transition-colors ${
                selected ? 'bg-primary text-white' : 'hover:bg-white'
              }`}
            >
              <span className={`text-[11px] ${selected ? 'text-white/80' : 'text-muted'}`}>{weekdayShort(day)}</span>
              <span
                className={`text-[15px] font-medium ${
                  selected ? 'text-white' : isToday(day) ? 'text-primary' : 'text-muted'
                }`}
              >
                {dayNumber(day)}
              </span>
              <span
                aria-hidden
                className={`mt-1 h-1 w-1 rounded-full ${hasTasks ? (selected ? 'bg-white' : 'bg-primary') : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
