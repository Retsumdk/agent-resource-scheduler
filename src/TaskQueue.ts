import { Task, TaskPriority } from './types';

export class TaskQueue {
  private queue: Task[] = [];
  private priorityMap: Record<TaskPriority, number> = {
    'low': 0,
    'medium': 1,
    'high': 2,
    'critical': 3
  };

  enqueue(task: Task): void {
    this.queue.push(task);
    this.sortQueue();
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // 1. Critical tasks first
      if (this.priorityMap[a.priority] !== this.priorityMap[b.priority]) {
        return this.priorityMap[b.priority] - this.priorityMap[a.priority];
      }
      
      // 2. Deadline approaching first
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      // 3. FIFO for same priority
      return a.submittedAt.getTime() - b.submittedAt.getTime();
    });
  }

  peek(): Task | undefined {
    return this.queue[0];
  }

  dequeue(): Task | undefined {
    return this.queue.shift();
  }

  remove(taskId: string): boolean {
    const index = this.queue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  getPending(): Task[] {
    return [...this.queue];
  }

  getLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}
