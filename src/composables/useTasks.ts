import { ref, computed } from 'vue';
import type { Task, Status, TaskDraft } from '../types';
import { loadTasks, saveTasks } from '../lib/storage';

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useTasks() {
  const tasks = ref<Task[]>(loadTasks());

  const byStatus = computed(() => {
    const map: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    for (const task of tasks.value) {
      if (task.status in map) map[task.status].push(task);
    }
    for (const status of ['todo', 'doing', 'done'] as Status[]) {
      map[status].sort((a, b) => b.createdAt - a.createdAt);
    }
    return map;
  });

  function persist(): boolean {
    return saveTasks(tasks.value);
  }

  function add(draft: TaskDraft): Task {
    const task: Task = {
      id: createId(),
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      tags: draft.tags,
      status: 'todo',
      createdAt: Date.now(),
    };
    tasks.value = [task, ...tasks.value];
    persist();
    return task;
  }

  function update(id: string, draft: TaskDraft): void {
    const task = tasks.value.find((t) => t.id === id);
    if (!task) return;
    task.title = draft.title;
    task.description = draft.description;
    task.priority = draft.priority;
    task.tags = draft.tags;
    persist();
  }

  function remove(id: string): void {
    tasks.value = tasks.value.filter((t) => t.id !== id);
    persist();
  }

  function moveStatus(id: string, status: Status): void {
    const task = tasks.value.find((t) => t.id === id);
    if (!task || task.status === status) return;
    task.status = status;
    persist();
  }

  return { tasks, byStatus, add, update, remove, moveStatus };
}