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