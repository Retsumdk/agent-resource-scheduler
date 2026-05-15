#!/usr/bin/env bun
import { Command } from "commander";
import { ResourcePool } from './ResourcePool';
import { TaskQueue } from './TaskQueue';
import { Scheduler } from './Scheduler';
import { Task, ResourceNode, ResourceRequirements } from './types';
import { v4 as uuidv4 } from 'uuid';

async function runSimulation() {
  console.log("Starting Agent Resource Scheduler Simulation...");
  
  const pool = new ResourcePool();
  const queue = new TaskQueue();
  const scheduler = new Scheduler(pool, queue);

  // Add some resource nodes
  const nodes: ResourceNode[] = [
    {
      id: "node-high-perf-1",
      type: "cpu",
      capacity: { cpuCores: 64, memoryMB: 128000 },
      available: { cpuCores: 64, memoryMB: 128000 },
      costPerHour: 2.50,
      latencyMs: 10
    },
    {
      id: "node-gpu-1",
      type: "gpu",
      capacity: { cpuCores: 16, memoryMB: 64000, gpuVRAM: 24000 },
      available: { cpuCores: 16, memoryMB: 64000, gpuVRAM: 24000 },
      costPerHour: 5.00,
      latencyMs: 50
    },
    {
      id: "node-edge-1",
      type: "cpu",
      capacity: { cpuCores: 4, memoryMB: 8000 },
      available: { cpuCores: 4, memoryMB: 8000 },
      costPerHour: 0.10,
      latencyMs: 5
    }
  ];

  nodes.forEach(n => pool.addNode(n));

  scheduler.on('taskStarted', ({ task, event }) => {
    console.log(`>>> TASK STARTED: ${task.name} on ${event.nodeId}`);
  });

  scheduler.on('taskCompleted', ({ task }) => {
    console.log(`<<< TASK COMPLETED: ${task.name}`);
  });

  // Submit some tasks
  const sampleTasks: Omit<Task, 'id' | 'submittedAt' | 'status'>[] = [
    {
      name: "Agent Brain Training",
      priority: "high",
      requirements: { cpuCores: 8, memoryMB: 32000, gpuVRAM: 12000 },
      estimatedDurationMs: 2000
    },
    {
      name: "Background Web Crawl",
      priority: "low",
      requirements: { cpuCores: 2, memoryMB: 4000 },
      estimatedDurationMs: 5000
    },
    {
      name: "Urgent Sentiment Analysis",
      priority: "critical",
      requirements: { cpuCores: 4, memoryMB: 8000 },
      estimatedDurationMs: 1000
    },
    {
      name: "Video Transcoding",
      priority: "medium",
      requirements: { cpuCores: 16, memoryMB: 32000 },
      estimatedDurationMs: 3000
    }
  ];

  sampleTasks.forEach(t => {
    const task: Task = {
      ...t,
      id: uuidv4(),
      submittedAt: new Date(),
      status: 'pending'
    };
    scheduler.submitTask(task);
  });

  // Wait for simulation to finish
  let interval = setInterval(() => {
    const metrics = scheduler.getMetrics();
    console.log(`--- Metrics: Processed: ${metrics.totalTasksProcessed}, Active: ${scheduler.getActiveTasksCount()}, Cost: $${metrics.totalComputeCost.toFixed(4)}, Utilization: ${(metrics.utilizationRate * 100).toFixed(1)}%`);
    
    if (metrics.totalTasksProcessed === sampleTasks.length) {
      console.log("Simulation finished successfully.");
      clearInterval(interval);
      process.exit(0);
    }
  }, 1000);
}

const program = new Command();
program
  .name("agent-resource-scheduler")
  .description("Dynamic resource allocation and scheduling system for long-running agent tasks")
  .version("1.0.0");

program
  .command("simulate")
  .description("Run a simulation of the resource scheduler")
  .action(runSimulation);

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
