import type { Task, Status, Priority } from '../types';

const TASKS_KEY = 'kanban.tasks';
const THEME_KEY = 'kanban.theme';

const STATUSES: Status[] = ['todo', 'doing', 'done'];
const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.description === 'string' &&
    STATUSES.includes(task.status as Status) &&
    PRIORITIES.includes(task.priority as Priority) &&
    Array.isArray(task.tags) &&
    task.tags.every((tag) => typeof tag === 'string') &&
    typeof task.createdAt === 'number'
  );
}

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isTask) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): boolean {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}

export type StoredTheme = 'light' | 'dark' | null;

export function loadTheme(): StoredTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: 'light' | 'dark'): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}