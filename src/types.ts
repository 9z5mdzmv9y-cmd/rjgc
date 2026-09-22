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