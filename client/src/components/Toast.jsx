import { useEffect } from 'react';

export default function Toast({ toast, onDone }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [toast, onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4" aria-live="polite">
      {toast && (
        <div
          key={toast.id}
          className={`rounded px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.tone === 'error' ? 'bg-danger' : 'bg-ink'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
