import { useCallback, useMemo, useRef, useState } from 'react';
import { api } from './api/tasks.js';
import HomeView from './components/HomeView.jsx';
import { PlusIcon } from './components/Icons.jsx';
import Onboarding from './components/Onboarding.jsx';
import SearchView from './components/SearchView.jsx';
import TaskForm from './components/TaskForm.jsx';
import Toast from './components/Toast.jsx';
import { defaultDayInWeek } from './utils/dates.js';

const ONBOARDED_KEY = 'todo.onboarded';

// Browser storage can be missing or blocked (private mode); the app works without it.
function readOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [onboarded, setOnboarded] = useState(readOnboarded);
  const [view, setView] = useState('home'); // 'home' | 'search'
  const [form, setForm] = useState(null); // null | { task?, day? }
  const [version, setVersion] = useState(0); // bumped after every change, so views refetch
  const [toast, setToast] = useState(null);
  // Day selected in the home strip; "+" adds the new task to that day.
  const homeDay = useRef(new Date());

  const refresh = () => setVersion((v) => v + 1);
  const notify = useCallback((message, tone = 'default') => setToast({ message, tone, id: Date.now() }), []);
  const clearToast = useCallback(() => setToast(null), []);
  const closeForm = useCallback(() => setForm(null), []);

  const actions = useMemo(
    () => ({
      edit: (task) => setForm({ task }),
      async setStatus(task, status) {
        try {
          await api.update(task.id, { status });
          refresh();
          if (status === 'completed') notify('Task completed');
        } catch (err) {
          notify(err.message, 'error');
        }
      },
      async remove(task) {
        try {
          await api.remove(task.id);
          setForm(null);
          refresh();
          notify('Task deleted');
        } catch (err) {
          notify(err.message, 'error');
        }
      },
    }),
    [notify],
  );

  async function save(data) {
    const isEdit = Boolean(form?.task?.id);
    if (isEdit) await api.update(form.task.id, data);
    else await api.create(data);
    setForm(null);
    refresh();
    notify(isEdit ? 'Task updated' : 'Task created');
  }

  function finishOnboarding() {
    try {
      localStorage.setItem(ONBOARDED_KEY, '1');
    } catch {
      // Not remembered; onboarding shows again next visit.
    }
    setOnboarded(true);
  }

  if (!onboarded) return <Onboarding onStart={finishOnboarding} />;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 pb-28 md:max-w-2xl lg:max-w-6xl lg:px-8">
      {view === 'home' ? (
        <HomeView
          version={version}
          actions={actions}
          onSearch={() => setView('search')}
          onAdd={(weekStart) => setForm({ day: defaultDayInWeek(weekStart) })}
          onDayChange={(day) => {
            homeDay.current = day;
          }}
        />
      ) : (
        <SearchView version={version} actions={actions} onBack={() => setView('home')} />
      )}

      <button
        type="button"
        onClick={() => setForm({ day: view === 'home' ? homeDay.current : undefined })}
        aria-label="Add task"
        className="fixed bottom-6 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center lg:left-auto lg:right-10 lg:translate-x-0 justify-center rounded-full bg-primary text-white shadow-fab hover:bg-primary/90 active:scale-95"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {form && (
        <TaskForm
          key={form.task?.id ?? 'new'}
          task={form.task}
          day={form.day}
          onSave={save}
          onDelete={actions.remove}
          onClose={closeForm}
        />
      )}

      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}
