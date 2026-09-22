import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import KanbanBoard from '../src/components/KanbanBoard.vue';
import type { Task, Status } from '../src/types';

const byStatus: Record<Status, Task[]> = {
  todo: [{ id: 'a', title: 'A', description: '', status: 'todo', priority: 'low', tags: [], createdAt: 1 }],
  doing: [],
  done: [],
};

describe('KanbanBoard', () => {
  it('渲染三列标题', () => {
    const wrapper = mount(KanbanBoard, { props: { byStatus } });
    expect(wrapper.text()).toContain('待办');
    expect(wrapper.text()).toContain('进行中');
    expect(wrapper.text()).toContain('完成');
  });

  it('透传 move 事件', () => {
    const wrapper = mount(KanbanBoard, { props: { byStatus } });
    (wrapper.findComponent({ name: 'TaskColumn' }).vm as any).$emit('move', 'a', 'doing');
    expect(wrapper.emitted('move')).toBeTruthy();
  });
});