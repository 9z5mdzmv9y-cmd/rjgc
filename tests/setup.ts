import { afterEach } from 'vitest';
import { enableAutoUnmount } from '@vue/test-utils';

// happy-dom 无 matchMedia，这里做最小 polyfill（默认浅色系统）
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

enableAutoUnmount(afterEach);

afterEach(() => {
  localStorage.clear();
});