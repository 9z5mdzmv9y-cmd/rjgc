import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskCard from '../src/components/TaskCard.vue';
import type { Task } from '../src/types';

const task: Task = {
  id: 't1',
  title: '写报告',
  description: '周报',
  status: 'todo',
  priority: 'high',
  tags: ['工作'],
  createdAt: 1700000000000,
};

describe('TaskCard', () => {
  it('渲染标题、描述、优先级与标签', () => {
    const wrapper = mount(TaskCard, { props: { task } });
    expect(wrapper.text()).toContain('写报告');
    expect(wrapper.text()).toContain('周报');
    expect(wrapper.text()).toContain('高');
    expect(wrapper.text()).toContain('工作');
  });

  it('点击编辑与删除触发事件', async () => {
    const wrapper = mount(TaskCard, { props: { task } });
    await wrapper.find('[data-test="edit"]').trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    await wrapper.find('[data-test="delete"]').trigger('click');
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('dragstart 写入 dataTransfer', async () => {
    const wrapper = mount(TaskCard, { props: { task } });
    const data: Record<string, string> = {};
    const dataTransfer = { setData: (k: string, v: string) => (data[k] = v) };
    await wrapper.find('article').trigger('dragstart', { dataTransfer } as any);
    expect(data['text/plain']).toBe('t1');
    expect(wrapper.emitted('drag-start')).toBeTruthy();
  });
});