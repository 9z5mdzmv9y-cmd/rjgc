import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TaskForm from '../src/components/TaskForm.vue';

async function setInput(wrapper: any, selector: string, value: string) {
  const input = wrapper.find(selector);
  await input.setValue(value);
}

describe('TaskForm', () => {
  it('标题为空时校验失败不提交', async () => {
    const wrapper = mount(TaskForm, { props: { task: null } });
    await wrapper.find('form').trigger('submit');
    expect(wrapper.text()).toContain('标题不能为空');
    expect(wrapper.emitted('submit')).toBeFalsy();
  });

  it('填写标题后提交 draft', async () => {
    const wrapper = mount(TaskForm, { props: { task: null } });
    await setInput(wrapper, '[data-test="title"]', '新任务');
    await setInput(wrapper, '[data-test="description"]', '描述');
    await setInput(wrapper, '[data-test="tags"]', '工作, 生活');
    await wrapper.find('[data-test="priority"]').setValue('low');
    await wrapper.find('form').trigger('submit');

    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const draft = (emitted as any)[0][0];
    expect(draft.title).toBe('新任务');
    expect(draft.description).toBe('描述');
    expect(draft.priority).toBe('low');
    expect(draft.tags).toEqual(['工作', '生活']);
  });

  it('编辑模式回填数据', () => {
    const wrapper = mount(TaskForm, {
      props: {
        task: {
          id: '1', title: '旧标题', description: '旧描述', status: 'todo',
          priority: 'medium', tags: ['a'], createdAt: 1,
        },
      },
    });
    expect((wrapper.find('[data-test="title"]').element as HTMLInputElement).value).toBe('旧标题');
  });
});