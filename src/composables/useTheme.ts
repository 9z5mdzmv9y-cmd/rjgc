import { ref } from 'vue';
import { loadTheme, saveTheme } from '../lib/storage';

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const stored = loadTheme();
  const theme = ref<'light' | 'dark'>(stored ?? (systemPrefersDark() ? 'dark' : 'light'));
  const isDark = ref(theme.value === 'dark');

  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', isDark.value);
  }

  function toggle(): void {
    isDark.value = !isDark.value;
    theme.value = isDark.value ? 'dark' : 'light';
    saveTheme(theme.value);
    applyTheme();
  }

  function onSystemChange(e: MediaQueryListEvent): void {
    // 用户未手动选择过（无存储）才跟随系统
    if (loadTheme() === null) {
      isDark.value = e.matches;
      theme.value = e.matches ? 'dark' : 'light';
      applyTheme();
    }
  }

  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onSystemChange);
  }

  applyTheme();

  return { theme, isDark, toggle };
}