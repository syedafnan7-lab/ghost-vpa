import { 
  CanaryItem, 
  CaseDossier, 
  EgoGraphData, 
  BenchmarkMetrics, 
  AuditLog, 
  UserRole 
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Simulation Controls
  getSimStatus: async () => {
    const res = await fetch(`${API_BASE}/sim/status`);
    return res.json();
  },
  controlSim: async (action: string, speed?: number, scenario?: string) => {
    const res = await fetch(`${API_BASE}/sim/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, speed, scenario })
    });
    return res.json();
  },

  // Canary Registry
  getCanaries: async (): Promise<CanaryItem[]> => {
    const res = await fetch(`${API_BASE}/canaries`);
    return res.json();
  },
  registerCanary: async (data: { vpa: string; designated_bank: string; canary_type: string; purpose: string }) => {
    const res = await fetch(`${API_BASE}/canaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Temporal Graph
  getEgoGraph: async (entityId: string, depth = 2, maxNodes = 50, windowHours = 72): Promise<EgoGraphData> => {
    const res = await fetch(`${API_BASE}/graph/ego/${encodeURIComponent(entityId)}?depth=${depth}&max_nodes=${maxNodes}&window_hours=${windowHours}`);
    return res.json();
  },

  // Cases & Investigation
  getCases: async (): Promise<CaseDossier[]> => {
    const res = await fetch(`${API_BASE}/cases`);
    return res.json();
  },
  takeCaseAction: async (caseId: string, action: string, notes: string, role: UserRole) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Role': role
      },
      body: JSON.stringify({ action, notes, actor_role: role })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Action failed');
    }
    return res.json();
  },
  getSTIXBundle: async (caseId: string) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/stix-bundle`);
    return res.json();
  },

  // ML Benchmarks
  getBenchmarkResults: async (): Promise<BenchmarkMetrics> => {
    const res = await fetch(`${API_BASE}/benchmark/results`);
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch(`${API_BASE}/audit`);
    return res.json();
  }
};
