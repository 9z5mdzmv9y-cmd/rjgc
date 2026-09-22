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