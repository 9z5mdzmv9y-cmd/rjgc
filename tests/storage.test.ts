import { describe, it, expect, beforeEach } from 'vitest';
import { loadTasks, saveTasks, loadTheme, saveTheme } from '../src/lib/storage';
import type { Task } from '../src/types';

const sample: Task = {
  id: '1',
  title: '买牛奶',
  description: '',
  status: 'todo',
  priority: 'medium',
  tags: [],
  createdAt: 1000,
};

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('初始为空数组', () => {
    expect(loadTasks()).toEqual([]);
  });

  it('tasks 写入后可读回', () => {
    expect(saveTasks([sample])).toBe(true);
    expect(loadTasks()).toEqual([sample]);
  });

  it('JSON 损坏时回退空数组', () => {
    localStorage.setItem('kanban.tasks', '{bad json');
    expect(loadTasks()).toEqual([]);
  });

  it('形状错误的项被过滤，仅保留合法任务', () => {
    localStorage.setItem(
      'kanban.tasks',
      JSON.stringify([
        null,
        { id: 'a', title: 'ok', description: '', status: 'todo', priority: 'low', tags: [], createdAt: 1 },
        { bad: true },
      ]),
    );
    expect(loadTasks()).toEqual([
      { id: 'a', title: 'ok', description: '', status: 'todo', priority: 'low', tags: [], createdAt: 1 },
    ]);
  });

  it('theme 缺省返回 null', () => {
    expect(loadTheme()).toBeNull();
  });

  it('theme 写入后可读回', () => {
    expect(saveTheme('dark')).toBe(true);
    expect(loadTheme()).toBe('dark');
  });
});