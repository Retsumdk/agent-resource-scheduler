export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ResourceRequirements {
  cpuCores: number;
  memoryMB: number;
  gpuVRAM?: number;
  apiTokens?: number;
}

export interface Task {
  id: string;
  name: string;
  priority: TaskPriority;
  requirements: ResourceRequirements;
  estimatedDurationMs: number;
  submittedAt: Date;
  deadline?: Date;
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
}

export interface ResourceNode {
  id: string;
  type: 'cpu' | 'gpu' | 'api';
  capacity: ResourceRequirements;
  available: ResourceRequirements;
  costPerHour: number;
  latencyMs: number;
}

export interface ScheduleEvent {
  taskId: string;
  nodeId: string;
  startTime: Date;
  endTime: Date;
  projectedCost: number;
}

export interface SchedulerMetrics {
  totalTasksProcessed: number;
  averageWaitTimeMs: number;
  totalComputeCost: number;
  utilizationRate: number;
}
