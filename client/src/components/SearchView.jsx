import { useEffect, useRef, useState } from 'react';
import { api } from '../api/tasks.js';
import { ArrowLeftIcon, CloseIcon, SearchIcon } from './Icons.jsx';
import TaskItem from './TaskItem.jsx';

/** Search screen from the Figma "Frame 9": back arrow, search box, matching tasks. */
export default function SearchView({ version, actions, onBack }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults(null);
      setLoading(false);
      setError('');
      return undefined;
    }
    let alive = true;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .list({ search: term })
        .then((data) => {
          if (!alive) return;
          setResults(data.tasks);
          setError('');
        })
        .catch((err) => alive && setError(err.message))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, version]);

  return (
    <div className="mx-auto max-w-2xl pt-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to home"
        className="-ml-2 flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-white"
      >
        <ArrowLeftIcon />
      </button>

      <label className="relative mt-3 block">
        <span className="sr-only">Search tasks</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onBack()}
          placeholder="Search by title or description"
          className="field pr-20 [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-canvas"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
          <SearchIcon className="pointer-events-none h-5 w-5 text-ink" />
        </span>
      </label>

      <div className="mt-3" aria-live="polite">
        {!query.trim() && (
          <p className="mt-10 text-center text-sm text-muted">Type a word from a task’s title or description.</p>
        )}
        {error && <p className="rounded bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        {query.trim() && loading && !results && <p className="text-sm text-muted">Searching…</p>}
        {results && !error && (
          <>
            <p className="py-1 text-xs text-muted">
              {results.length === 0
                ? `No tasks match “${query.trim()}”.`
                : `${results.length} ${results.length === 1 ? 'task' : 'tasks'} found`}
            </p>
            <ul>
              {results.map((task) => (
                <TaskItem key={task.id} task={task} actions={actions} withDate />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
