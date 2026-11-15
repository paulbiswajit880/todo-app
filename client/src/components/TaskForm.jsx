import { useEffect, useRef, useState } from 'react';
import {
  defaultStart,
  formatLongDate,
  formatTime,
  fromInputs,
  toDateInput,
  toTimeInput,
} from '../utils/dates.js';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../utils/task.js';
import { CalendarIcon, ClockIcon, CloseIcon, TrashIcon } from './Icons.jsx';

function Segmented({ label, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="grid gap-1 rounded border border-line bg-white p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`truncate rounded-sm px-1 py-2 text-xs font-medium transition-colors ${
              value === o.value ? 'bg-primary text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * A field that looks like the Figma one ("Start" with a clock, "Friday 14,
 * January" with a calendar) but opens the device's own date/time picker.
 */
function PickerField({ id, type, value, onChange, display, placeholder, icon: Icon, iconRight = false, invalid, label }) {
  return (
    <div
      className={`relative flex h-12 items-center gap-2.5 rounded border bg-white px-3.5 text-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
        invalid ? 'border-danger' : 'border-line'
      }`}
    >
      {!iconRight && <Icon className="h-4 w-4 shrink-0 text-ink" />}
      <span className={`flex-1 truncate ${value ? 'text-ink' : 'text-ink/80'}`}>{value ? display : placeholder}</span>
      {iconRight && <Icon className="h-5 w-5 shrink-0 text-ink" />}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label={label}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/** "Add New Task" sheet from the Figma design; also used to view and edit a task. */
export default function TaskForm({ task, day, onSave, onDelete, onClose }) {
  const isEdit = Boolean(task?.id);
  const start = isEdit ? new Date(task.dueAt) : defaultStart(day);
  const end = isEdit && task.endAt ? new Date(task.endAt) : null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [date, setDate] = useState(toDateInput(start));
  const [startTime, setStartTime] = useState(toTimeInput(start));
  const [endTime, setEndTime] = useState(end ? toTimeInput(end) : '');
  const [priority, setPriority] = useState(task?.priority ?? '');
  const [status, setStatus] = useState(task?.status ?? 'pending');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (!isEdit) titleRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [isEdit, onClose]);

  // Clear a field's error as soon as it is edited.
  const edit = (setter, ...fields) => (e) => {
    setter(e.target.value);
    if (fields.some((f) => errors[f])) {
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !fields.includes(k))));
    }
  };

  async function submit(e) {
    e.preventDefault();
    const dueAt = fromInputs(date, startTime);
    const endAt = endTime ? fromInputs(date, endTime) : null;
    const next = {};
    if (!title.trim()) next.title = 'Give the task a title';
    if (!dueAt) next.dueAt = 'Pick a date and a start time';
    if (dueAt && endAt && endAt <= dueAt) next.endAt = 'End time must be after the start time';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError('');
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt.toISOString(),
        endAt: endAt ? endAt.toISOString() : null,
        priority: priority || null,
        ...(isEdit && { status }),
      });
    } catch (err) {
      setErrors(err.details ?? {});
      setFormError(err.message);
      setSaving(false);
    }
  }

  const selectedDate = fromInputs(date, '00:00');
  const timeError = errors.dueAt || errors.endAt;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center md:p-6">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onSubmit={submit}
        noValidate
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-lg bg-white px-5 pt-5 shadow-sheet md:max-w-md md:rounded-lg md:pb-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="task-form-title" className="text-base font-semibold text-ink">
            {isEdit ? 'Task Details' : 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 flex h-9 w-9 items-center justify-center rounded text-ink hover:bg-canvas"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="field-label">
              Task title <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              ref={titleRef}
              value={title}
              onChange={edit(setTitle, 'title')}
              maxLength={120}
              placeholder="Doing Homework"
              aria-invalid={Boolean(errors.title)}
              className={`field ${errors.title ? 'border-danger' : ''}`}
            />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
          </div>

          <div>
            <span className="field-label">
              Set Time <span className="text-danger">*</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <PickerField
                id="start"
                type="time"
                label="Start time"
                value={startTime}
                onChange={edit(setStartTime, 'dueAt', 'endAt')}
                display={startTime && formatTime(fromInputs('2000-01-01', startTime))}
                placeholder="Start"
                icon={ClockIcon}
                invalid={Boolean(errors.dueAt)}
              />
              <PickerField
                id="end"
                type="time"
                label="End time (optional)"
                value={endTime}
                onChange={edit(setEndTime, 'endAt')}
                display={endTime && formatTime(fromInputs('2000-01-01', endTime))}
                placeholder="Ends"
                icon={ClockIcon}
                invalid={Boolean(errors.endAt)}
              />
            </div>
            {timeError && <p className="mt-1 text-xs text-danger">{timeError}</p>}
            {endTime && (
              <button type="button" onClick={() => setEndTime('')} className="mt-1 text-xs text-primary hover:underline">
                Clear end time
              </button>
            )}
          </div>

          <div>
            <span className="field-label">
              Set Date <span className="text-danger">*</span>
            </span>
            <PickerField
              id="date"
              type="date"
              label="Date"
              value={date}
              onChange={edit(setDate, 'dueAt')}
              display={selectedDate && formatLongDate(selectedDate)}
              placeholder="Pick a date"
              icon={CalendarIcon}
              iconRight
              invalid={Boolean(errors.dueAt) && !date}
            />
          </div>

          <div>
            <label htmlFor="description" className="field-label">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={edit(setDescription, 'description')}
              maxLength={1000}
              rows={3}
              placeholder="Add Description"
              className="field h-auto resize-none py-3"
            />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
          </div>

          <Segmented label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          {isEdit && <Segmented label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />}

          {formError && !Object.keys(errors).length && (
            <p className="rounded bg-danger-soft p-3 text-sm text-danger">{formError}</p>
          )}
        </div>

        <div className="pb-safe sticky bottom-0 -mx-5 mt-6 flex gap-3 border-t border-line bg-white px-5 pt-3 md:static md:mx-0 md:border-0 md:p-0">
          {isEdit && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label="Delete task"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-danger-soft text-danger hover:bg-danger/20"
            >
              <TrashIcon />
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="h-12 flex-1 rounded bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
