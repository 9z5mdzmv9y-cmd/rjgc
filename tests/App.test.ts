import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('App', () => {
  it('renders the app title', () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('看板待办事项');
  });
});