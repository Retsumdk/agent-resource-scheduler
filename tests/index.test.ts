import { expect, test, describe, beforeEach } from "bun:test";
import { ResourcePool } from "../src/ResourcePool";
import { TaskQueue } from "../src/TaskQueue";
import { Scheduler } from "../src/Scheduler";
import { Task, ResourceNode } from "../src/types";

describe("Agent Resource Scheduler", () => {
  let pool: ResourcePool;
  let queue: TaskQueue;
  let scheduler: Scheduler;

  beforeEach(() => {
    pool = new ResourcePool();
    queue = new TaskQueue();
    scheduler = new Scheduler(pool, queue);
  });

  test("should add nodes to the pool", () => {
    const node: ResourceNode = {
      id: "test-node",
      type: "cpu",
      capacity: { cpuCores: 4, memoryMB: 8192 },
      available: { cpuCores: 4, memoryMB: 8192 },
      costPerHour: 0.5,
      latencyMs: 10
    };
    pool.addNode(node);
    expect(pool.getNodes().length).toBe(1);
    expect(pool.getNodes()[0].id).toBe("test-node");
  });

  test("should sort tasks by priority", () => {
    const taskLow: Task = {
      id: "1", name: "Low", priority: "low",
      requirements: { cpuCores: 1, memoryMB: 1024 },
      estimatedDurationMs: 100, submittedAt: new Date(Date.now() - 1000),
      status: 'pending'
    };
    const taskHigh: Task = {
      id: "2", name: "High", priority: "high",
      requirements: { cpuCores: 1, memoryMB: 1024 },
      estimatedDurationMs: 100, submittedAt: new Date(),
      status: 'pending'
    };
    
    queue.enqueue(taskLow);
    queue.enqueue(taskHigh);
    
    expect(queue.dequeue()?.priority).toBe("high");
    expect(queue.dequeue()?.priority).toBe("low");
  });

  test("should allocate and release resources", () => {
    const node: ResourceNode = {
      id: "node", type: "cpu",
      capacity: { cpuCores: 10, memoryMB: 1000 },
      available: { cpuCores: 10, memoryMB: 1000 },
      costPerHour: 1, latencyMs: 10
    };
    pool.addNode(node);
    
    const requirements = { cpuCores: 5, memoryMB: 500 };
    const success = pool.allocateResources("node", requirements);
    
    expect(success).toBe(true);
    expect(pool.getNodes()[0].available.cpuCores).toBe(5);
    
    pool.releaseResources("node", requirements);
    expect(pool.getNodes()[0].available.cpuCores).toBe(10);
  });

  test("should schedule task when resources are available", async () => {
    const node: ResourceNode = {
      id: "node", type: "cpu",
      capacity: { cpuCores: 10, memoryMB: 1000 },
      available: { cpuCores: 10, memoryMB: 1000 },
      costPerHour: 1, latencyMs: 10
    };
    pool.addNode(node);

    const task: Task = {
      id: "task-1", name: "Test Task", priority: "high",
      requirements: { cpuCores: 2, memoryMB: 200 },
      estimatedDurationMs: 10, submittedAt: new Date(),
      status: 'pending'
    };

    return new Promise((resolve) => {
      scheduler.on('taskCompleted', ({ task: completedTask }) => {
        expect(completedTask.id).toBe("task-1");
        expect(completedTask.status).toBe("completed");
        resolve();
      });

      scheduler.submitTask(task);
    });
  });
});
