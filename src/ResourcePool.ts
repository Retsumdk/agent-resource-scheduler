import { ResourceNode, ResourceRequirements } from './types';

export class ResourcePool {
  private nodes: Map<string, ResourceNode> = new Map();

  constructor() {}

  addNode(node: ResourceNode): void {
    this.nodes.set(node.id, node);
  }

  getNodes(): ResourceNode[] {
    return Array.from(this.nodes.values());
  }

  findSuitableNode(requirements: ResourceRequirements): ResourceNode | null {
    const candidates = this.getNodes().filter(node => 
      node.available.cpuCores >= requirements.cpuCores &&
      node.available.memoryMB >= requirements.memoryMB &&
      (requirements.gpuVRAM === undefined || node.available.gpuVRAM! >= requirements.gpuVRAM) &&
      (requirements.apiTokens === undefined || node.available.apiTokens! >= requirements.apiTokens)
    );

    if (candidates.length === 0) return null;

    // Optimize for lowest cost first, then lowest latency
    return candidates.sort((a, b) => {
      if (a.costPerHour !== b.costPerHour) {
        return a.costPerHour - b.costPerHour;
      }
      return a.latencyMs - b.latencyMs;
    })[0];
  }

  allocateResources(nodeId: string, requirements: ResourceRequirements): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    if (
      node.available.cpuCores >= requirements.cpuCores &&
      node.available.memoryMB >= requirements.memoryMB &&
      (requirements.gpuVRAM === undefined || node.available.gpuVRAM! >= requirements.gpuVRAM) &&
      (requirements.apiTokens === undefined || node.available.apiTokens! >= requirements.apiTokens)
    ) {
      node.available.cpuCores -= requirements.cpuCores;
      node.available.memoryMB -= requirements.memoryMB;
      if (requirements.gpuVRAM) node.available.gpuVRAM! -= requirements.gpuVRAM;
      if (requirements.apiTokens) node.available.apiTokens! -= requirements.apiTokens;
      return true;
    }

    return false;
  }

  releaseResources(nodeId: string, requirements: ResourceRequirements): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.available.cpuCores += requirements.cpuCores;
    node.available.memoryMB += requirements.memoryMB;
    if (requirements.gpuVRAM) node.available.gpuVRAM! += requirements.gpuVRAM;
    if (requirements.apiTokens) node.available.apiTokens! += requirements.apiTokens;
    
    // Cap at total capacity
    node.available.cpuCores = Math.min(node.available.cpuCores, node.capacity.cpuCores);
    node.available.memoryMB = Math.min(node.available.memoryMB, node.capacity.memoryMB);
    if (node.available.gpuVRAM !== undefined) {
      node.available.gpuVRAM = Math.min(node.available.gpuVRAM, node.capacity.gpuVRAM || 0);
    }
  }

  getTotalCapacity(): ResourceRequirements {
    return this.getNodes().reduce((acc, node) => ({
      cpuCores: acc.cpuCores + node.capacity.cpuCores,
      memoryMB: acc.memoryMB + node.capacity.memoryMB,
      gpuVRAM: (acc.gpuVRAM || 0) + (node.capacity.gpuVRAM || 0),
      apiTokens: (acc.apiTokens || 0) + (node.capacity.apiTokens || 0)
    }), { cpuCores: 0, memoryMB: 0, gpuVRAM: 0, apiTokens: 0 });
  }

  getUtilization(): number {
    const total = this.getTotalCapacity();
    const available = this.getNodes().reduce((acc, node) => ({
      cpuCores: acc.cpuCores + node.available.cpuCores,
      memoryMB: acc.memoryMB + node.available.memoryMB,
      gpuVRAM: (acc.gpuVRAM || 0) + (node.available.gpuVRAM || 0),
      apiTokens: (acc.apiTokens || 0) + (node.available.apiTokens || 0)
    }), { cpuCores: 0, memoryMB: 0, gpuVRAM: 0, apiTokens: 0 });

    const cpuUsage = 1 - (available.cpuCores / total.cpuCores);
    const memUsage = 1 - (available.memoryMB / total.memoryMB);
    
    return (cpuUsage + memUsage) / 2;
  }
}
