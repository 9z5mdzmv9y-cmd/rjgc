import { describe, it, expect, beforeEach } from 'vitest';
import { useTasks } from '../src/composables/useTasks';
import type { TaskDraft } from '../src/types';

const draft: TaskDraft = {
  title: '买牛奶',
  description: '低脂',
  priority: 'high',
  tags: ['生活'],
};

beforeEach(() => localStorage.clear());

describe('useTasks', () => {
  it('add 新增一条 todo 任务并持久化', () => {
    const store = useTasks();
    const task = store.add(draft);
    expect(task.status).toBe('todo');
    expect(store.tasks.value).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('kanban.tasks')!)).toHaveLength(1);
  });

  it('byStatus 按状态分组并按 createdAt 倒序', () => {
    const store = useTasks();
    const first = store.add(draft);
    store.add({ ...draft, title: '第二条' });
    const second = first.createdAt > 0 ? store.tasks.value.find((t) => t.title === '第二条')! : null;
    expect(store.byStatus.value.todo).toHaveLength(2);
    if (second) expect(store.byStatus.value.todo[0].id).toBe(second.id);
  });

  it('moveStatus 修改状态并持久化', () => {
    const store = useTasks();
    const task = store.add(draft);
    store.moveStatus(task.id, 'doing');
    expect(store.tasks.value[0].status).toBe('doing');
    expect(store.byStatus.value.doing).toHaveLength(1);
    expect(store.byStatus.value.todo).toHaveLength(0);
  });

  it('update 修改字段', () => {
    const store = useTasks();
    const task = store.add(draft);
    store.update(task.id, { ...draft, title: '改标题', priority: 'low' });
    expect(store.tasks.value[0].title).toBe('改标题');
    expect(store.tasks.value[0].priority).toBe('low');
  });

  it('remove 删除任务', () => {
    const store = useTasks();
    const task = store.add(draft);
    store.remove(task.id);
    expect(store.tasks.value).toHaveLength(0);
  });

  it('从 localStorage 恢复已有任务', () => {
    localStorage.setItem(
      'kanban.tasks',
      JSON.stringify([
        { id: 'x', title: '已有', description: '', status: 'done', priority: 'low', tags: [], createdAt: 9 },
      ])
    );
    const store = useTasks();
    expect(store.tasks.value).toHaveLength(1);
    expect(store.byStatus.value.done).toHaveLength(1);
  });
});