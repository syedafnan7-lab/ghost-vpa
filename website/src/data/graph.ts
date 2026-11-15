// Client-side reproduction of the temporal graph concepts implemented in
// backend/app/graph/temporal_engine.py: bounded ego data, canary-seeded label
// propagation (CS-LP) and motif detection. The website never pretends to be
// the live engine; it re-derives the same reading from the same records.
import type { PaymentRecord } from './scenarios';

export type NodeKind = 'CANARY' | 'MULE' | 'FEEDER' | 'DEVICE' | 'BENIGN';

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  bank: string | null;
  isSeed: boolean;
  risk: number;
  cslp: number;
  hopToCanary: number;
  inDegree: number;
  outDegree: number;
  amountIn: number;
  amountOut: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  minutesAgo: number;
  rail: string;
  isTripwire: boolean;
  isDeviceLink: boolean;
}

export interface Motif {
  type: string;
  severity: 'CRITICAL' | 'HIGH';
  nodeId: string;
  title: string;
  detail: string;
}

export interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  motifs: Motif[];
  stats: {
    nodes: number;
    edges: number;
    canaries: number;
    mules: number;
    intercepted: number;
    maxRisk: number;
    windowHours: number;
  };
}

const WINDOW_HOURS = 72;
const DECAY_LAMBDA = 0.05; // per hour, matches temporal_engine.py
const RESTART_ALPHA = 0.85;
const CSLP_ITERATIONS = 15;

interface RawNode {
  id: string;
  bank: string | null;
  isSeed: boolean;
}

function classify(
  id: string,
  isSeed: boolean,
  inDegree: number,
  outDegree: number,
  touchesCanary: boolean,
): NodeKind {
  if (id.startsWith('DEV_')) return 'DEVICE';
  if (isSeed) return 'CANARY';
  if (id.startsWith('FEEDER_')) return 'FEEDER';
  if (outDegree >= 2 && inDegree === 0) return 'FEEDER';
  if (touchesCanary) return 'MULE';
  return 'BENIGN';
}

/** BFS hop distance to the nearest canary over payment edges. */
function hopDistances(nodes: RawNode[], paymentEdges: GraphEdge[]): Map<string, number> {
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of paymentEdges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const node of nodes) {
    if (node.isSeed) {
      dist.set(node.id, 0);
      queue.push(node.id);
    }
  }
  while (queue.length) {
    const current = queue.shift() as string;
    const d = dist.get(current) ?? 0;
    for (const next of adjacency.get(current) ?? []) {
      if (!dist.has(next)) {
        dist.set(next, d + 1);
        queue.push(next);
      }
    }
  }
  for (const node of nodes) if (!dist.has(node.id)) dist.set(node.id, -1);
  return dist;
}

/** CS-LP: canaries seed 1.0, risk propagates along temporal edges. */
function computeCslp(nodes: RawNode[], edges: GraphEdge[]): Map<string, number> {
  const scores = new Map<string, number>();
  for (const node of nodes) scores.set(node.id, node.isSeed ? 1 : 0);
  const seeds = new Set(nodes.filter((n) => n.isSeed).map((n) => n.id));
  if (seeds.size === 0) return scores;

  for (let iteration = 0; iteration < CSLP_ITERATIONS; iteration += 1) {
    const next = new Map(scores);
    for (const node of nodes) {
      if (seeds.has(node.id)) continue;
      let weightedSum = 0;
      let totalWeight = 0;
      for (const edge of edges) {
        if (edge.isDeviceLink) continue;
        const deltaHours = Math.max(0, edge.minutesAgo / 60);
        const weight = Math.exp(-DECAY_LAMBDA * deltaHours);
        if (edge.target === node.id) {
          weightedSum += weight * (scores.get(edge.source) ?? 0);
          totalWeight += weight;
        } else if (edge.source === node.id) {
          weightedSum += weight * (scores.get(edge.target) ?? 0);
          totalWeight += weight;
        }
      }
      if (totalWeight > 0) {
        const propagated = weightedSum / totalWeight;
        next.set(node.id, (1 - RESTART_ALPHA) * (scores.get(node.id) ?? 0) + RESTART_ALPHA * propagated);
      }
    }
    for (const [id, value] of next) scores.set(id, value);
  }
  return scores;
}

function detectMotifs(nodes: RawNode[], edges: GraphEdge[]): Motif[] {
  const motifs: Motif[] = [];
  const paymentEdges = edges.filter((e) => !e.isDeviceLink);

  for (const node of nodes) {
    if (node.isSeed) continue;
    const inEdges = paymentEdges.filter((e) => e.target === node.id);
    const outEdges = paymentEdges.filter((e) => e.source === node.id);

    const recentIn = inEdges.filter((e) => e.minutesAgo <= 60);
    const uniqueRemitters = new Set(recentIn.map((e) => e.source));
    if (uniqueRemitters.size >= 3) {
      const totalIn = recentIn.reduce((sum, e) => sum + e.amount, 0);
      motifs.push({
        type: 'RAPID_FAN_IN_AGGREGATION',
        severity: 'HIGH',
        nodeId: node.id,
        title: 'Rapid fan-in aggregation',
        detail: `${uniqueRemitters.size} distinct senders aggregated ₹${totalIn.toLocaleString('en-IN')} into this account within 60 minutes.`,
      });
    }

    const recentOut = outEdges.filter((e) => e.minutesAgo <= 30);
    const uniqueBeneficiaries = new Set(recentOut.map((e) => e.target));
    if (uniqueBeneficiaries.size >= 3) {
      const totalOut = recentOut.reduce((sum, e) => sum + e.amount, 0);
      motifs.push({
        type: 'RAPID_FAN_OUT_DISPERSION',
        severity: 'CRITICAL',
        nodeId: node.id,
        title: 'Rapid layering fan-out',
        detail: `${uniqueBeneficiaries.size} outbound splits dispersed ₹${totalOut.toLocaleString('en-IN')} within 30 minutes.`,
      });
    }

    if (recentIn.length > 0 && recentOut.length > 0) {
      const latestIn = Math.min(...recentIn.map((e) => e.minutesAgo));
      const earliestOut = Math.max(...recentOut.map((e) => e.minutesAgo));
      const deltaT = latestIn - earliestOut;
      const sumIn = recentIn.reduce((sum, e) => sum + e.amount, 0);
      const sumOut = recentOut.reduce((sum, e) => sum + e.amount, 0);
      const ratio = sumIn > 0 ? sumOut / sumIn : 0;
      if (deltaT >= 0 && deltaT <= 15 && ratio >= 0.8 && ratio <= 1.1) {
        motifs.push({
          type: 'HIGH_VELOCITY_PASS_THROUGH',
          severity: 'CRITICAL',
          nodeId: node.id,
          title: 'High-velocity pass-through',
          detail: `Funds passed through in ${deltaT.toFixed(1)} min with ${(ratio * 100).toFixed(1)}% amount conservation.`,
        });
      }
    }
  }
  return motifs;
}

export function buildScenarioGraph(records: PaymentRecord[]): ScenarioGraph {
  const rawNodes = new Map<string, RawNode>();
  const edges: GraphEdge[] = [];
  const canaryTargets = new Set<string>();

  const ensureNode = (id: string, bank: string | null, isSeed = false) => {
    if (!rawNodes.has(id)) rawNodes.set(id, { id, bank, isSeed });
    else if (isSeed) rawNodes.get(id)!.isSeed = true;
  };

  for (const record of records) {
    ensureNode(record.senderId, record.senderBank);
    const benefNodeId = record.isCanary ? record.benefVpa : record.benefId ?? record.benefVpa;
    ensureNode(benefNodeId, record.benefBank, record.isCanary);
    if (record.isCanary) canaryTargets.add(record.benefVpa);
    edges.push({
      id: record.eventId,
      source: record.senderId,
      target: benefNodeId,
      amount: record.amount,
      minutesAgo: record.minutesAgo,
      rail: record.rail,
      isTripwire: record.isCanary,
      isDeviceLink: false,
    });

    const deviceId = `DEV_${record.deviceToken}`;
    ensureNode(deviceId, null);
    edges.push({
      id: `DEVLINK-${record.eventId}`,
      source: record.senderId,
      target: deviceId,
      amount: 0,
      minutesAgo: record.minutesAgo,
      rail: record.rail,
      isTripwire: false,
      isDeviceLink: true,
    });
  }

  const paymentEdges = edges.filter((e) => !e.isDeviceLink);
  const nodes = Array.from(rawNodes.values());

  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    outDegree.set(node.id, 0);
  }
  for (const edge of paymentEdges) {
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const touchesCanary = new Set<string>();
  for (const edge of paymentEdges) {
    if (edge.isTripwire) {
      touchesCanary.add(edge.source);
      touchesCanary.add(edge.target);
    }
  }

  const hops = hopDistances(nodes, paymentEdges);
  const cslp = computeCslp(nodes, edges);

  const graphNodes: GraphNode[] = nodes.map((node) => {
    const inDeg = inDegree.get(node.id) ?? 0;
    const outDeg = outDegree.get(node.id) ?? 0;
    const amountIn = paymentEdges.filter((e) => e.target === node.id).reduce((s, e) => s + e.amount, 0);
    const amountOut = paymentEdges.filter((e) => e.source === node.id).reduce((s, e) => s + e.amount, 0);
    const score = cslp.get(node.id) ?? 0;
    return {
      id: node.id,
      label: node.id,
      kind: classify(node.id, node.isSeed, inDeg, outDeg, touchesCanary.has(node.id)),
      bank: node.bank,
      isSeed: node.isSeed,
      cslp: score,
      risk: Math.min(1, score * 1.2),
      hopToCanary: hops.get(node.id) ?? -1,
      inDegree: inDeg,
      outDegree: outDeg,
      amountIn,
      amountOut,
    };
  });

  const motifs = detectMotifs(nodes, edges);
  const intercepted = paymentEdges.filter((e) => e.isTripwire).reduce((s, e) => s + e.amount, 0);
  const maxRisk = graphNodes.reduce((max, n) => Math.max(max, n.risk), 0);

  return {
    nodes: graphNodes,
    edges,
    motifs,
    stats: {
      nodes: graphNodes.length,
      edges: edges.length,
      canaries: graphNodes.filter((n) => n.kind === 'CANARY').length,
      mules: graphNodes.filter((n) => n.kind === 'MULE').length,
      intercepted,
      maxRisk,
      windowHours: WINDOW_HOURS,
    },
  };
}

export interface NodeEvidence {
  title: string;
  rows: { label: string; value: string; tone?: 'canary' | 'alarm' | 'benign' | 'default' }[];
}

export function evidenceFor(node: GraphNode, graph: ScenarioGraph): NodeEvidence {
  const rows: NodeEvidence['rows'] = [];
  const paymentEdges = graph.edges.filter((e) => !e.isDeviceLink);

  rows.push({
    label: 'CS-LP risk',
    value: node.risk.toFixed(2),
    tone: node.kind === 'CANARY' ? 'canary' : node.risk > 0.7 ? 'alarm' : 'default',
  });
  rows.push({
    label: 'Hop distance to canary',
    value: node.hopToCanary < 0 ? 'not connected' : `${node.hopToCanary} hop${node.hopToCanary === 1 ? '' : 's'}`,
  });

  for (const edge of paymentEdges.filter((e) => e.target === node.id)) {
    rows.push({
      label: 'Received',
      value: `₹${edge.amount.toLocaleString('en-IN')} from ${edge.source} · ${edge.minutesAgo.toFixed(0)} min before now`,
    });
  }
  for (const edge of paymentEdges.filter((e) => e.source === node.id)) {
    rows.push({
      label: edge.isTripwire ? 'Probe to canary' : 'Sent',
      value: `₹${edge.amount.toLocaleString('en-IN')} to ${edge.target}`,
      tone: edge.isTripwire ? 'canary' : 'default',
    });
  }

  const deviceEdges = graph.edges.filter((e) => e.isDeviceLink && e.source === node.id);
  for (const edge of deviceEdges) {
    const peers = graph.edges.filter((e) => e.isDeviceLink && e.target === edge.target && e.source !== node.id);
    rows.push({
      label: 'Shared device token',
      value: `${edge.target.replace(/^DEV_/, '')} · also used by ${peers.length} other account${peers.length === 1 ? '' : 's'}`,
      tone: 'default',
    });
  }

  if (node.kind === 'CANARY') {
    return {
      title: 'Registered canary endpoint',
      rows: [
        { label: 'Status', value: 'ACTIVE — remains live to keep counting probes', tone: 'canary' },
        { label: 'Role', value: 'Ground-truth seed (Y = 1.0) for label propagation' },
        ...rows.filter((r) => r.label === 'CS-LP risk'),
      ],
    };
  }

  return { title: node.kind === 'FEEDER' ? 'Upstream feeder candidate' : 'Account under review', rows };
}
