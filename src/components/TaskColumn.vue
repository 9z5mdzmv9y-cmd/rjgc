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