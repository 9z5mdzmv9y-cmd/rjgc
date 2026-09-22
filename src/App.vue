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