# agent-resource-scheduler

Dynamic resource allocation and scheduling system for long-running agent tasks, optimizing for compute cost and latency.

## Features

- **Priority-Based Queuing**: Intelligent task prioritization (Low, Medium, High, Critical) with deadline awareness.
- **Resource Management**: Tracking of CPU, Memory, GPU VRAM, and API tokens across multiple compute nodes.
- **Cost Optimization**: Automatically selects the most cost-effective resources for each task.
- **Latency Awareness**: Factors in node latency for time-sensitive agent operations.
- **Metrics Tracking**: Real-time reporting on utilization, average wait times, and total compute costs.
- **Event-Driven Architecture**: Hooks for task lifecycle events (Submission, Start, Completion).

## Installation

```bash
bun install
```

## Usage

### Run Simulation

You can run a built-in simulation to see the scheduler in action:

```bash
bun run src/index.ts simulate
```

### API Usage

```typescript
import { ResourcePool } from './src/ResourcePool';
import { TaskQueue } from './src/TaskQueue';
import { Scheduler } from './src/Scheduler';

const pool = new ResourcePool();
const queue = new TaskQueue();
const scheduler = new Scheduler(pool, queue);

// Add a compute node
pool.addNode({
  id: "compute-1",
  type: "cpu",
  capacity: { cpuCores: 8, memoryMB: 16384 },
  available: { cpuCores: 8, memoryMB: 16384 },
  costPerHour: 0.45,
  latencyMs: 15
});

// Submit a task
scheduler.submitTask({
  id: "task-123",
  name: "Large Language Model Inference",
  priority: "high",
  requirements: { cpuCores: 4, memoryMB: 8192 },
  estimatedDurationMs: 5000,
  submittedAt: new Date(),
  status: 'pending'
});
```

## Architecture

The system consists of four primary components:

1.  **ResourcePool**: Manages the inventory of available hardware/API nodes and handles allocation/release logic.
2.  **TaskQueue**: Maintains the list of pending tasks, ensuring higher priority and urgent tasks move to the front.
3.  **Scheduler**: The central engine that matches pending tasks with available resources and manages the execution lifecycle.
4.  **Types**: A centralized definition of the system's data models for consistency.

## License

MIT
