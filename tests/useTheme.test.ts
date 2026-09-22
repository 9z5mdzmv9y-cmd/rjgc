import { describe, it, expect, beforeEach } from 'vitest';
import { useTheme } from '../src/composables/useTheme';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('useTheme', () => {
  it('无存储且系统浅色时默认浅色', () => {
    const { isDark } = useTheme();
    expect(isDark.value).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('有存储时使用存储值', () => {
    localStorage.setItem('kanban.theme', 'dark');
    const { isDark } = useTheme();
    expect(isDark.value).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggle 切换并持久化', () => {
    const { isDark, toggle } = useTheme();
    expect(isDark.value).toBe(false);
    toggle();
    expect(isDark.value).toBe(true);
    expect(localStorage.getItem('kanban.theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    toggle();
    expect(localStorage.getItem('kanban.theme')).toBe('light');
  });
});