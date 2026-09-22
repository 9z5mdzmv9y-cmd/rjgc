# 看板待办事项应用 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端单页看板待办事项应用：三列看板、卡片拖拽改状态、深色模式、localStorage 持久化。

**Architecture:** Vue 3 Composition API 应用，`App` 持有任务与主题两个组合式状态（`useTasks` / `useTheme`），通过 `KanbanBoard → TaskColumn → TaskCard` 渲染三列；拖拽用原生 HTML5 Drag & Drop（`dragstart` 写 id，目标列 `drop` 改状态）；`TaskForm` 模态框承担新建/编辑；存储层 `lib/storage` 封装 localStorage 读写。

**Tech Stack:** Vue 3.5 + Vite 5 + TypeScript 5.6 + Tailwind CSS 3.4（class 模式深色）+ Vitest 2 + @vue/test-utils + happy-dom。

## Global Constraints

- 主界面仅三列看板（待办 / 进行中 / 完成），**不支持列内排序**，拖拽只做跨列改状态。
- 状态三档：`todo` / `doing` / `done`；优先级三档：`high`（红）/ `medium`（黄）/ `low`（绿）。
- 任务字段：标题（必填，非空校验）、描述（选填）、优先级、标签（多个，自由输入）、创建时间（自动 `Date.now()`）。
- localStorage 键名固定：`kanban.tasks`（Task[] JSON）、`kanban.theme`（`'light' | 'dark'`，**缺失即跟随系统**）。
- 深色模式采用 Tailwind `darkMode: 'class'`，通过在 `<html>` 上切换 `dark` class 生效。
- 删除操作必须二次确认。
- 列内卡片固定按 `createdAt` 倒序（最新在上）。
- UI 界面文案使用中文。
- 不引入 Vue Router、Pinia、拖拽库、UI 组件库（YAGNI）。

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`、`vite.config.ts`、`tsconfig.json`、`index.html`、`tailwind.config.js`、`postcss.config.js`、`src/main.ts`、`src/style.css`、`src/App.vue`、`src/types.ts`、`tests/setup.ts`、`tests/App.test.ts`

**Interfaces:**
- Consumes: 无。
- Produces: `src/types.ts` 导出 `Status` / `Priority` / `Task` / `TaskDraft` / `STATUS_LABELS` / `PRIORITY_LABELS`；`src/main.ts` 挂载 `App`。

- [ ] **Step 1: 写入项目配置文件**

`package.json`：

```json
{
  "name": "kanban-task-board",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.1",
    "@vue/test-utils": "^2.4.6",
    "autoprefixer": "^10.4.20",
    "happy-dom": "^15.11.7",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.1.10"
  }
}
```

`vite.config.ts`：

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

`tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "tests/**/*.ts"]
}
```

`index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>看板待办</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`tailwind.config.js`：

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: { extend: {} },
  plugins: [],
};
```

`postcss.config.js`：

```js
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

`src/style.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/types.ts`：

```ts
export type Status = 'todo' | 'doing' | 'done';
export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  createdAt: number;
}

export interface TaskDraft {
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
}

export const STATUS_LABELS: Record<Status, string> = {
  todo: '待办',
  doing: '进行中',
  done: '完成',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};
```

`src/main.ts`：

```ts
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');
```

`src/App.vue`（临时最小实现，后续任务扩展）：

```vue
<template>
  <main class="p-6">
    <h1 class="text-2xl font-bold">看板待办事项</h1>
  </main>
</template>
```

`tests/setup.ts`：

```ts
import { afterEach } from 'vitest';
import { cleanup } from '@vue/test-utils';

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

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

`tests/App.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';

describe('App', () => {
  it('renders the app title', () => {
    const wrapper = mount(App);
    expect(wrapper.text()).toContain('看板待办事项');
  });
});
```

- [ ] **Step 2: 安装依赖并运行冒烟测试**

Run: `npm install`
Expected: 无报错，生成 `node_modules` 与 `package-lock.json`。

- [ ] **Step 3: 运行测试验证失败/通过**

Run: `npm test`
Expected: PASS，1 个测试通过（App 渲染标题）。

- [ ] **Step 4: 提交**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html \
  tailwind.config.js postcss.config.js src/main.ts src/style.css src/types.ts src/App.vue \
  tests/setup.ts tests/App.test.ts
git commit -m "chore: scaffold Vue 3 + Vite + Tailwind + Vitest project"
```

---

### Task 2: 存储层

**Files:**
- Create: `src/lib/storage.ts`、`tests/storage.test.ts`

**Interfaces:**
- Consumes: `src/types.ts` 的 `Task` 类型。
- Produces: 具名导出 `loadTasks(): Task[]`、`saveTasks(tasks: Task[]): boolean`、`loadTheme(): 'light' | 'dark' | null`、`saveTheme(theme: 'light' | 'dark'): boolean`。

- [ ] **Step 1: 写失败测试**

`tests/storage.test.ts`：

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { loadTasks, saveTasks, loadTheme, saveTheme } from '../src/lib/storage';
import type { Task } from '../src/types';

const sample: Task = {
  id: '1',
  title: '买牛奶',
  description: '',
  status: 'todo',
  priority: 'medium',
  tags: [],
  createdAt: 1000,
};

beforeEach(() => localStorage.clear());

describe('storage', () => {
  it('初始为空数组', () => {
    expect(loadTasks()).toEqual([]);
  });

  it('tasks 写入后可读回', () => {
    expect(saveTasks([sample])).toBe(true);
    expect(loadTasks()).toEqual([sample]);
  });

  it('JSON 损坏时回退空数组', () => {
    localStorage.setItem('kanban.tasks', '{bad json');
    expect(loadTasks()).toEqual([]);
  });

  it('theme 缺省返回 null', () => {
    expect(loadTheme()).toBeNull();
  });

  it('theme 写入后可读回', () => {
    expect(saveTheme('dark')).toBe(true);
    expect(loadTheme()).toBe('dark');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，`src/lib/storage` 模块不存在。

- [ ] **Step 3: 实现存储层**

`src/lib/storage.ts`：

```ts
import type { Task } from '../types';

const TASKS_KEY = 'kanban.tasks';
const THEME_KEY = 'kanban.theme';

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): boolean {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}

export type StoredTheme = 'light' | 'dark' | null;

export function loadTheme(): StoredTheme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: 'light' | 'dark'): boolean {
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/storage.ts tests/storage.test.ts
git commit -m "feat: add localStorage persistence layer"
```

---

### Task 3: 任务状态组合式函数

**Files:**
- Create: `src/composables/useTasks.ts`、`tests/useTasks.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`（`Task` / `TaskDraft` / `Status`）、`src/lib/storage.ts`（`loadTasks` / `saveTasks`）。
- Produces: `useTasks()` 返回 `{ tasks: Ref<Task[]>, byStatus: ComputedRef<Record<Status, Task[]>>, add(draft: TaskDraft): Task, update(id: string, draft: TaskDraft): void, remove(id: string): void, moveStatus(id: string, status: Status): void }`；同时导出 `createId(): string`。

- [ ] **Step 1: 写失败测试**

`tests/useTasks.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，`useTasks` 模块不存在。

- [ ] **Step 3: 实现 useTasks**

`src/composables/useTasks.ts`：

```ts
import { ref, computed } from 'vue';
import type { Task, Status, TaskDraft } from '../types';
import { loadTasks, saveTasks } from '../lib/storage';

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useTasks() {
  const tasks = ref<Task[]>(loadTasks());

  const byStatus = computed(() => {
    const map: Record<Status, Task[]> = { todo: [], doing: [], done: [] };
    for (const task of tasks.value) {
      if (task.status in map) map[task.status].push(task);
    }
    for (const status of ['todo', 'doing', 'done'] as Status[]) {
      map[status].sort((a, b) => b.createdAt - a.createdAt);
    }
    return map;
  });

  function persist(): boolean {
    return saveTasks(tasks.value);
  }

  function add(draft: TaskDraft): Task {
    const task: Task = {
      id: createId(),
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      tags: draft.tags,
      status: 'todo',
      createdAt: Date.now(),
    };
    tasks.value = [task, ...tasks.value];
    persist();
    return task;
  }

  function update(id: string, draft: TaskDraft): void {
    const task = tasks.value.find((t) => t.id === id);
    if (!task) return;
    task.title = draft.title;
    task.description = draft.description;
    task.priority = draft.priority;
    task.tags = draft.tags;
    persist();
  }

  function remove(id: string): void {
    tasks.value = tasks.value.filter((t) => t.id !== id);
    persist();
  }

  function moveStatus(id: string, status: Status): void {
    const task = tasks.value.find((t) => t.id === id);
    if (!task || task.status === status) return;
    task.status = status;
    persist();
  }

  return { tasks, byStatus, add, update, remove, moveStatus };
}
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS（storage 与 useTasks 全部通过）。

- [ ] **Step 5: 提交**

```bash
git add src/composables/useTasks.ts tests/useTasks.test.ts
git commit -m "feat: add useTasks composable with CRUD and persistence"
```

---

### Task 4: 主题组合式函数

**Files:**
- Create: `src/composables/useTheme.ts`、`tests/useTheme.test.ts`

**Interfaces:**
- Consumes: `src/lib/storage.ts`（`loadTheme` / `saveTheme`）。
- Produces: `systemPrefersDark(): boolean`；`useTheme()` 返回 `{ theme: Ref<'light' | 'dark'>, isDark: Ref<boolean>, toggle(): void }`。

- [ ] **Step 1: 写失败测试**

`tests/useTheme.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，`useTheme` 模块不存在。

- [ ] **Step 3: 实现 useTheme**

`src/composables/useTheme.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/composables/useTheme.ts tests/useTheme.test.ts
git commit -m "feat: add useTheme composable with system preference and persistence"
```

---

### Task 5: TaskCard 组件

**Files:**
- Create: `src/components/TaskCard.vue`、`tests/TaskCard.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`（`Task` / `Priority` / `PRIORITY_LABELS`）。
- Produces: `<TaskCard :task="Task">`；事件 `edit(id)`、`delete(id)`、`drag-start(id, event)`。

- [ ] **Step 1: 写失败测试**

`tests/TaskCard.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现 TaskCard**

`src/components/TaskCard.vue`：

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { Task, Priority } from '../types';
import { PRIORITY_LABELS } from '../types';

const props = defineProps<{ task: Task }>();

const emit = defineEmits<{
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
  (e: 'drag-start', id: string, event: DragEvent): void;
}>();

const PRIORITY_BADGE: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const badgeClass = computed(() => PRIORITY_BADGE[props.task.priority]);

function onDragStart(event: DragEvent): void {
  event.dataTransfer?.setData('text/plain', props.task.id);
  emit('drag-start', props.task.id, event);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN');
}
</script>

<template>
  <article
    draggable="true"
    class="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    @dragstart="onDragStart"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <h3 class="font-medium text-gray-900 dark:text-gray-100">{{ task.title }}</h3>
      <span class="shrink-0 rounded px-1.5 py-0.5 text-xs" :class="badgeClass">
        {{ PRIORITY_LABELS[task.priority] }}
      </span>
    </div>
    <p v-if="task.description" class="mb-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
      {{ task.description }}
    </p>
    <div v-if="task.tags.length" class="mb-2 flex flex-wrap gap-1">
      <span
        v-for="tag in task.tags"
        :key="tag"
        class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      >
        {{ tag }}
      </span>
    </div>
    <div class="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
      <span>{{ formatDate(task.createdAt) }}</span>
      <div class="flex gap-1">
        <button data-test="edit" class="rounded px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700" @click="emit('edit', task.id)">
          编辑
        </button>
        <button data-test="delete" class="rounded px-1.5 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700" @click="emit('delete', task.id)">
          删除
        </button>
      </div>
    </div>
  </article>
</template>
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/TaskCard.vue tests/TaskCard.test.ts
git commit -m "feat: add TaskCard component"
```

---

### Task 6: TaskForm 组件

**Files:**
- Create: `src/components/TaskForm.vue`、`tests/TaskForm.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`（`Task` / `TaskDraft` / `Priority` / `PRIORITY_LABELS`）。
- Produces: `<TaskForm :task="Task | null">`；事件 `submit(draft: TaskDraft)`、`close()`。

- [ ] **Step 1: 写失败测试**

`tests/TaskForm.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现 TaskForm**

`src/components/TaskForm.vue`：

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { Task, TaskDraft, Priority } from '../types';
import { PRIORITY_LABELS } from '../types';

const props = defineProps<{ task: Task | null }>();

const emit = defineEmits<{
  (e: 'submit', draft: TaskDraft): void;
  (e: 'close'): void;
}>();

const form = reactive<{ title: string; description: string; priority: Priority; tags: string }>({
  title: '',
  description: '',
  priority: 'medium',
  tags: '',
});
const error = reactive<{ title: string }>({ title: '' });

watch(
  () => props.task,
  (task) => {
    form.title = task?.title ?? '';
    form.description = task?.description ?? '';
    form.priority = task?.priority ?? 'medium';
    form.tags = task?.tags.join(', ') ?? '';
    error.title = '';
  },
  { immediate: true }
);

function onSubmit(): void {
  if (!form.title.trim()) {
    error.title = '标题不能为空';
    return;
  }
  const tags = form.tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    tags,
  });
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('close')">
    <div class="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
      <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {{ task ? '编辑任务' : '新建任务' }}
      </h2>
      <form @submit.prevent="onSubmit" class="space-y-3">
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">标题 *</label>
          <input
            data-test="title"
            v-model="form.title"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="输入任务标题"
          />
          <p v-if="error.title" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error.title }}</p>
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">描述</label>
          <textarea
            data-test="description"
            v-model="form.description"
            rows="3"
            class="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="可选描述"
          ></textarea>
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">优先级</label>
          <select
            data-test="priority"
            v-model="form.priority"
            class="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="high">{{ PRIORITY_LABELS.high }}</option>
            <option value="medium">{{ PRIORITY_LABELS.medium }}</option>
            <option value="low">{{ PRIORITY_LABELS.low }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-sm text-gray-600 dark:text-gray-300">标签（逗号分隔）</label>
          <input
            data-test="tags"
            v-model="form.tags"
            type="text"
            class="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            placeholder="工作, 生活"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="emit('close')"
          >
            取消
          </button>
          <button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            保存
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/TaskForm.vue tests/TaskForm.test.ts
git commit -m "feat: add TaskForm modal for create and edit"
```

---

### Task 7: TaskColumn 组件

**Files:**
- Create: `src/components/TaskColumn.vue`、`tests/TaskColumn.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`（`Task` / `Status` / `STATUS_LABELS`）、`src/components/TaskCard.vue`。
- Produces: `<TaskColumn :status="Status" :tasks="Task[]">`；事件 `move(id, status)`、`edit(id)`、`delete(id)`。

- [ ] **Step 1: 写失败测试**

`tests/TaskColumn.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现 TaskColumn**

`src/components/TaskColumn.vue`：

```vue
<script setup lang="ts">
import type { Task, Status } from '../types';
import { STATUS_LABELS } from '../types';
import TaskCard from './TaskCard.vue';

const props = defineProps<{ status: Status; tasks: Task[] }>();

const emit = defineEmits<{
  (e: 'move', id: string, status: Status): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function onDrop(event: DragEvent): void {
  const id = event.dataTransfer?.getData('text/plain');
  if (id) emit('move', id, props.status);
}
</script>

<template>
  <section class="flex min-h-[60vh] w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3 dark:bg-gray-900">
    <header class="mb-3 flex items-center justify-between px-1">
      <h2 class="font-semibold text-gray-700 dark:text-gray-200">{{ STATUS_LABELS[status] }}</h2>
      <span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {{ tasks.length }}
      </span>
    </header>
    <div
      data-test="dropzone"
      class="flex flex-1 flex-col gap-2 overflow-y-auto"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @edit="(id: string) => emit('edit', id)"
        @delete="(id: string) => emit('delete', id)"
      />
      <p v-if="tasks.length === 0" class="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        暂无任务
      </p>
    </div>
  </section>
</template>
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test` / `npm run typecheck`
Expected: PASS；typecheck 无报错（`status` 可在模板中直接引用）。

- [ ] **Step 5: 提交**

```bash
git add src/components/TaskColumn.vue tests/TaskColumn.test.ts
git commit -m "feat: add TaskColumn component with drop target"
```

---

### Task 8: KanbanBoard 组件

**Files:**
- Create: `src/components/KanbanBoard.vue`、`tests/KanbanBoard.test.ts`

**Interfaces:**
- Consumes: `src/types.ts`（`Status` / `Task`）、`src/components/TaskColumn.vue`。
- Produces: `<KanbanBoard :by-status="Record<Status, Task[]>">`；事件透传 `move(id, status)`、`edit(id)`、`delete(id)`。

- [ ] **Step 1: 写失败测试**

`tests/KanbanBoard.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，组件不存在。

- [ ] **Step 3: 实现 KanbanBoard**

`src/components/KanbanBoard.vue`：

```vue
<script setup lang="ts">
import type { Task, Status } from '../types';
import TaskColumn from './TaskColumn.vue';

defineProps<{ byStatus: Record<Status, Task[]> }>();

const emit = defineEmits<{
  (e: 'move', id: string, status: Status): void;
  (e: 'edit', id: string): void;
  (e: 'delete', id: string): void;
}>();

const columns: Status[] = ['todo', 'doing', 'done'];
</script>

<template>
  <div class="flex gap-4 overflow-x-auto p-4">
    <TaskColumn
      v-for="status in columns"
      :key="status"
      :status="status"
      :tasks="byStatus[status]"
      @move="(id: string, s: Status) => emit('move', id, s)"
      @edit="(id: string) => emit('edit', id)"
      @delete="(id: string) => emit('delete', id)"
    />
  </div>
</template>
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/components/KanbanBoard.vue tests/KanbanBoard.test.ts
git commit -m "feat: add KanbanBoard with three columns"
```

---

### Task 9: 组装 App（含主题切换与增删改查接线）

**Files:**
- Modify: `src/App.vue`
- Create: `tests/App-flow.test.ts`

**Interfaces:**
- Consumes: `src/composables/useTasks.ts`、`src/composables/useTheme.ts`、`src/components/KanbanBoard.vue`、`src/components/TaskForm.vue`。
- Produces: 完整可运行应用（这是最终组装节点，无下游消费者）。

- [ ] **Step 1: 写失败测试**

`tests/App-flow.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test`
Expected: FAIL，App 尚未包含这些元素。

- [ ] **Step 3: 实现 App**

`src/App.vue`：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { Task, TaskDraft } from './types';
import { useTasks } from './composables/useTasks';
import { useTheme } from './composables/useTheme';
import KanbanBoard from './components/KanbanBoard.vue';
import TaskForm from './components/TaskForm.vue';

const { tasks, byStatus, add, update, remove, moveStatus } = useTasks();
const { isDark, toggle } = useTheme();

const showForm = ref(false);
const editingTask = ref<Task | null>(null);

function openCreate(): void {
  editingTask.value = null;
  showForm.value = true;
}

function openEdit(id: string): void {
  editingTask.value = tasks.value.find((t) => t.id === id) ?? null;
  showForm.value = true;
}

function closeForm(): void {
  showForm.value = false;
  editingTask.value = null;
}

function handleSubmit(draft: TaskDraft): void {
  if (editingTask.value) {
    update(editingTask.value.id, draft);
  } else {
    add(draft);
  }
  closeForm();
}

function confirmDelete(id: string): void {
  if (window.confirm('确定删除这条任务吗？')) {
    remove(id);
  }
}
</script>

<template>
  <main class="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
    <header class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
      <h1 class="text-xl font-bold">看板待办事项</h1>
      <div class="flex items-center gap-2">
        <button
          data-test="new-task"
          class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          @click="openCreate"
        >
          新建任务
        </button>
        <button
          data-test="theme-toggle"
          class="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          @click="toggle"
        >
          {{ isDark ? '浅色模式' : '深色模式' }}
        </button>
      </div>
    </header>

    <KanbanBoard
      :by-status="byStatus"
      @move="(id, status) => moveStatus(id, status)"
      @edit="openEdit"
      @delete="confirmDelete"
    />

    <TaskForm
      v-if="showForm"
      :task="editingTask"
      @submit="handleSubmit"
      @close="closeForm"
    />
  </main>
</template>
```

- [ ] **Step 4: 运行全量测试与类型检查**

Run: `npm test`
Expected: PASS（全部套件）。

Run: `npm run typecheck`
Expected: 无错误输出。

- [ ] **Step 5: 提交**

```bash
git add src/App.vue tests/App-flow.test.ts
git commit -m "feat: assemble App with header, theme toggle, and board"
```

---

### Task 10: 构建与浏览器验证

**Files:**
- 无新增源文件；可能微调 `src/App.vue` 或样式。

**Interfaces:**
- Consumes: 全部已实现组件。
- Produces: 可部署构建产物（`dist/`），以及浏览器验证通过记录。

- [ ] **Step 1: 生产构建**

Run: `npm run build`
Expected: 成功生成 `dist/`，无类型错误。

- [ ] **Step 2: 启动预览服务**

Run: `npm run preview -- --port 4173`（或 `npm run dev`）
Expected: 服务启动，控制台无错误。

- [ ] **Step 3: 浏览器人工验证清单**

对照依次核验并记录结果：
1. 打开页面，三列「待办 / 进行中 / 完成」可见，初始为空。
2. 点「新建任务」：标题留空提交 → 提示「标题不能为空」且不保存。
3. 新建一条高优先级任务（填标题、描述、标签 `生活,工作`）→ 卡片出现在「待办」，优先级徽标为红色「高」，标签与创建时间可见。
4. 刷新页面 → 卡片仍在（localStorage 持久化）。
5. 拖拽卡片从「待办」到「进行中」再到「完成」→ 状态即时改变，刷新后保持。
6. 点卡片「编辑」改标题与优先级 → 保存后立即更新。
7. 点「删除」→ 弹确认，确认后卡片消失。
8. 点「深色模式」切换 → 页面变为深色；刷新后仍为深色（记住选择）。
9. 首开无存储时跟随系统偏好（浏览器切换系统主题验证）。

- [ ] **Step 4: 修复验证中发现的问题并回归**

Run: `npm test`（每次修复后）
Expected: PASS。

- [ ] **Step 5: 提交（如有变更）**

```bash
git add -A
git commit -m "fix: address browser verification findings"
```

---

## 自审结论

- **Spec 覆盖**：任务 CRUD（Task 3 / 9）、标题必填+描述选填+优先级三档+标签+创建时间（Task 1 types / 2 / 3 / 5 / 6）、三列看板拖拽改状态且不支持列内排序（Task 7 / 8 / 9）、深色模式一键切换并记住（Task 4 / 9）、默认跟随系统（Task 4）、localStorage 持久化刷新不丢失（Task 2 / 3 / 4）、删除确认（Task 9 `confirmDelete`）——全部有对应任务。
- **占位符扫描**：无 TBD / TODO / “适当处理”类占位；所有代码步骤给出完整代码。
- **类型一致性**：`Status` / `Priority` / `Task` / `TaskDraft` / `STATUS_LABELS` / `PRIORITY_LABELS` 在 Task 1 定义，后续任务签名与之一致；`useTasks` 返回 `{ tasks, byStatus, add, update, remove, moveStatus }` 与 App 调用一致；`useTheme` 返回 `{ theme, isDark, toggle }` 一致；组件事件名 `move` / `edit` / `delete` / `submit` / `close` / `drag-start` 在父子间一致。

> 注：本任务处于 Git 只读阶段，计划中的 `git commit` 步骤将在后续「多轮执行（计划→执行→确认→Git commit）」阶段实际执行。
