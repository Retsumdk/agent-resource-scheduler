import { ResourcePool } from './ResourcePool';
import { TaskQueue } from './TaskQueue';
import { Task, ScheduleEvent, SchedulerMetrics, ResourceNode } from './types';
import { EventEmitter } from 'events';

export class Scheduler extends EventEmitter {
  private resourcePool: ResourcePool;
  private taskQueue: TaskQueue;
  private activeSchedules: Map<string, ScheduleEvent> = new Map();
  private metrics: SchedulerMetrics = {
    totalTasksProcessed: 0,
    averageWaitTimeMs: 0,
    totalComputeCost: 0,
    utilizationRate: 0
  };

  private waitTimes: number[] = [];

  constructor(resourcePool: ResourcePool, taskQueue: TaskQueue) {
    super();
    this.resourcePool = resourcePool;
    this.taskQueue = taskQueue;
  }

  submitTask(task: Task): void {
    console.log(`[Scheduler] Task submitted: ${task.name} (${task.id})`);
    this.taskQueue.enqueue(task);
    this.processQueue();
  }

  private processQueue(): void {
    const task = this.taskQueue.peek();
    if (!task) return;

    const node = this.resourcePool.findSuitableNode(task.requirements);
    if (node) {
      this.taskQueue.dequeue();
      this.scheduleTask(task, node);
      // Recursively process if more tasks and resources
      setImmediate(() => this.processQueue());
    } else {
      console.log(`[Scheduler] No suitable node for task ${task.id}, waiting...`);
    }
  }

  private scheduleTask(task: Task, node: ResourceNode): void {
    const waitTime = Date.now() - task.submittedAt.getTime();
    this.waitTimes.push(waitTime);

    const success = this.resourcePool.allocateResources(node.id, task.requirements);
    if (!success) {
      console.error(`[Scheduler] Allocation failed for node ${node.id}`);
      this.taskQueue.enqueue(task); // Put back
      return;
    }

    const projectedCost = (task.estimatedDurationMs / 3600000) * node.costPerHour;
    
    const event: ScheduleEvent = {
      taskId: task.id,
      nodeId: node.id,
      startTime: new Date(),
      endTime: new Date(Date.now() + task.estimatedDurationMs),
      projectedCost
    };

    this.activeSchedules.set(task.id, event);
    task.status = 'running';
    
    console.log(`[Scheduler] Task ${task.id} scheduled on node ${node.id}. Projected cost: $${projectedCost.toFixed(4)}`);
    
    this.emit('taskStarted', { task, event });

    // Simulate task execution
    setTimeout(() => {
      this.completeTask(task, event);
    }, task.estimatedDurationMs);
  }

  private completeTask(task: Task, event: ScheduleEvent): void {
    this.resourcePool.releaseResources(event.nodeId, task.requirements);
    this.activeSchedules.delete(task.id);
    
    task.status = 'completed';
    this.metrics.totalTasksProcessed++;
    this.metrics.totalComputeCost += event.projectedCost;
    this.updateMetrics();

    console.log(`[Scheduler] Task ${task.id} completed. Resources released on ${event.nodeId}`);
    
    this.emit('taskCompleted', { task, event });
    
    // Check queue again
    this.processQueue();
  }

  private updateMetrics(): void {
    const avgWait = this.waitTimes.reduce((a, b) => a + b, 0) / (this.waitTimes.length || 1);
    this.metrics.averageWaitTimeMs = avgWait;
    this.metrics.utilizationRate = this.resourcePool.getUtilization();
  }

  getMetrics(): SchedulerMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  getActiveTasksCount(): number {
    return this.activeSchedules.size;
  }
}
