import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskColumn from '../src/components/TaskColumn.vue';
import type { Task } from '../src/types';

const task: Task = {
  id: 't1', title: '任务', description: '', status: 'todo',
  priority: 'medium', tags: [], createdAt: 1,
};

describe('TaskColumn', () => {
  it('渲染列标题与卡片', () => {
    const wrapper = mount(TaskColumn, { props: { status: 'todo', tasks: [task] } });
    expect(wrapper.text()).toContain('待办');
    expect(wrapper.text()).toContain('任务');
  });

  it('drop 触发 move 事件', async () => {
    const wrapper = mount(TaskColumn, { props: { status: 'done', tasks: [] } });
    const dataTransfer = { getData: () => 't1', setData: () => {}, dropEffect: '' };
    await wrapper.find('[data-test="dropzone"]').trigger('drop', { dataTransfer } as any);
    expect(wrapper.emitted('move')).toBeTruthy();
    expect((wrapper.emitted('move') as any)[0]).toEqual(['t1', 'done']);
  });
});