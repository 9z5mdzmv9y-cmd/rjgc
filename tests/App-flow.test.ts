import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('App 集成流程', () => {
  it('渲染顶栏标题、新建按钮与三列', () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('看板待办事项');
    expect(wrapper.text()).toContain('新建任务');
    expect(wrapper.text()).toContain('待办');
    expect(wrapper.text()).toContain('进行中');
    expect(wrapper.text()).toContain('完成');
  });

  it('新建任务流程', async () => {
    const wrapper = mount(App);
    await wrapper.find('[data-test="new-task"]').trigger('click');
    await wrapper.find('[data-test="title"]').setValue('集成任务');
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('集成任务');
    expect(JSON.parse(localStorage.getItem('kanban.tasks')!)).toHaveLength(1);
  });

  it('主题切换按钮切换 dark class', async () => {
    const wrapper = mount(App);
    await wrapper.find('[data-test="theme-toggle"]').trigger('click');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});