export const PRIORITY_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const PRIORITY_TEXT = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-danger',
};

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const isOverdue = (task) => task.status !== 'completed' && new Date(task.dueAt) < new Date();
