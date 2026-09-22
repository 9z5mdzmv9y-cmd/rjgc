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