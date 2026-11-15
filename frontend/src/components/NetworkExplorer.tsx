import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  Share2, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  AlertTriangle, 
  ExternalLink, 
  X, 
  ShieldAlert, 
  Cpu 
} from 'lucide-react';
import { EgoGraphData, GraphNodeItem, GraphEdgeItem, ActiveTab } from '../types';
import { api } from '../services/api';

interface NetworkExplorerProps {
  initialEntityId?: string;
  setActiveTab: (tab: ActiveTab) => void;
}

export const NetworkExplorer: React.FC<NetworkExplorerProps> = ({
  initialEntityId,
  setActiveTab
}) => {
  const [focalId, setFocalId] = useState<string>(initialEntityId || 'ACCT_SYNTH_HDFX_9912');
  const [depth, setDepth] = useState<number>(2);
  const [graphData, setGraphData] = useState<EgoGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<GraphNodeItem | null>(null);
  const [temporalWindowHours, setTemporalWindowHours] = useState<number>(72);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Load ego graph from API
  const fetchGraph = async (id: string, d = depth, winHours = temporalWindowHours) => {
    setLoading(true);
    try {
      const data = await api.getEgoGraph(id, d, 50, winHours);
      setGraphData(data);
      if (data.nodes.length > 0) {
        const found = data.nodes.find(n => n.id === id) || data.nodes[0];
        setSelectedNode(found);
      } else {
        setSelectedNode(null);
      }
    } catch (e) {
      console.error('Failed to load ego graph', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialEntityId) {
      setFocalId(initialEntityId);
      fetchGraph(initialEntityId, depth, temporalWindowHours);
    } else {
      fetchGraph(focalId, depth, temporalWindowHours);
    }
  }, [initialEntityId]);

  // Render D3 force-directed graph
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const width = svgRef.current.clientWidth || 800;
    const height = 540;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    // Container for zoom/pan
    const container = svg.append('g').attr('class', 'graph-container');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    // Deep copy nodes and edges to avoid mutating props
    const nodes: GraphNodeItem[] = graphData.nodes.map(d => ({ ...d }));
    const edges: GraphEdgeItem[] = graphData.edges.map(d => ({ ...d }));

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<GraphNodeItem, GraphEdgeItem>(edges).id(d => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(32));

    // Arrowhead marker definition
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#64748b');

    // Edges
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', d => d.is_tripwire ? '#ef4444' : '#475569')
      .attr('stroke-width', d => d.is_tripwire ? 2.5 : Math.max(1, Math.min(4, d.amount_inr / 15000)))
      .attr('stroke-dasharray', d => d.is_tripwire ? '4 2' : 'none')
      .attr('marker-end', 'url(#arrowhead)');

    // Node groups
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'cursor-pointer')
      .call(
        d3.drag<SVGGElement, GraphNodeItem>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    // Node identity. A force-directed graph needs the ALL-PAIRS pairlist —
    // any two nodes can end up visually adjacent — and the dataviz reference
    // palette documents that only its first three slots clear the CVD and
    // normal-vision floors under that pairlist (dark: worst pair CVD dE 9.4,
    // normal-vision 20.9). So the graph carries THREE hues and encodes the
    // remaining two entity classes by SHAPE plus the reserved accent/ink
    // tokens. A suspected mule deliberately gets no hue of its own: a canary
    // tripwire raises a triage flag (REVIEW_REQUIRED), it is not a confirmed
    // classification, and colouring it like one would overstate the evidence.
    const NODE_HUE: Record<string, string> = {
      DEVICE_TOKEN: '#3987e5', // slot 1 — blue
      FEEDER_NODE:  '#d95926', // slot 2 — orange
    };
    const HUE_BENIGN = '#199e70'; // slot 3 — aqua
    const HUE_CANARY = '#f59e0b'; // reserved accent, paired with hexagon form
    const INK_TRIAGE = '#e2e8f0'; // neutral ink, paired with square form

    const nodeRadius = (d: GraphNodeItem) =>
      d.is_seed ? 18 : d.type === 'FEEDER_NODE' ? 16 : 13;

    function nodeForm(d: GraphNodeItem): string {
      const r = nodeRadius(d);
      if (d.type === 'CANARY') {
        // Pointy-top hexagon — the bank's own decoy, distinct by form and by
        // the canary accent. It is also the largest node and pulses.
        const pts = [[0, r], [-0.866 * r, 0.5 * r], [-0.866 * r, -0.5 * r],
                     [0, -r], [0.866 * r, -0.5 * r], [0.866 * r, 0.5 * r]];
        return `M${pts.map(p => p.join(',')).join('L')}Z`;
      }
      if (d.type === 'SENDER_MULE') {
        const s = r * 0.86;
        return `M${-s},${-s}H${s}V${s}H${-s}Z`;
      }
      return `M${r},0A${r},${r} 0 1,1 ${-r},0A${r},${r} 0 1,1 ${r},0Z`;
    }

    function nodeFill(d: GraphNodeItem): string {
      if (d.type === 'CANARY') return HUE_CANARY;
      if (d.type === 'SENDER_MULE') return INK_TRIAGE;
      return NODE_HUE[d.type] ?? HUE_BENIGN;
    }

    // Node marks: one path per node so form and fill stay in lockstep.
    node.append('path')
      .attr('d', nodeForm)
      .attr('fill', nodeFill)
      // 2px surface ring: nodes overlap in a force layout, and the gap reads
      // as separation without needing a lighter fill.
      .attr('stroke', d => selectedNode?.id === d.id ? '#ffffff' : '#020617')
      .attr('stroke-width', d => selectedNode?.id === d.id ? 3 : 2)
      .attr('class', d => d.is_seed ? 'animate-pulse' : '');

    // Direct labels: seed/attention-worthy nodes only. A label on all 50
    // nodes is unreadable; a 2px halo keeps each one legible over links.
    node.append('text')
      .text(d => {
        if (!d.is_seed && d.type !== 'CANARY' && d.type !== 'SENDER_MULE') return '';
        return d.id.length > 14 ? d.id.slice(0, 12) + '…' : d.id;
      })
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, ui-monospace, Menlo, monospace')
      .attr('fill', '#cbd5e1')
      .attr('paint-order', 'stroke')
      .attr('stroke', '#020617')
      .attr('stroke-width', 3)
      .attr('dx', 16)
      .attr('dy', 4);

    // Simulation tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNodeItem).x || 0)
        .attr('y1', d => (d.source as GraphNodeItem).y || 0)
        .attr('x2', d => (d.target as GraphNodeItem).x || 0)
        .attr('y2', d => (d.target as GraphNodeItem).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, selectedNode]);

  const handleZoom = (scaleFactor: number) => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.scaleBy, scaleFactor);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Focal Entity ID (e.g. ACCT_SYNTH_HDFX_9912)..."
              value={focalId}
              onChange={(e) => setFocalId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGraph(focalId, depth, temporalWindowHours)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>
          <button
            onClick={() => fetchGraph(focalId, depth, temporalWindowHours)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
          >
            {loading ? 'Tracing...' : 'Trace Graph'}
          </button>
        </div>

        {/* Depth & Temporal Slider */}
        <div className="flex items-center space-x-4 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Hop Depth:</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDepth(d);
                  fetchGraph(focalId, d, temporalWindowHours);
                }}
                className={`px-2 py-0.5 rounded text-xs font-mono transition ${
                  depth === d ? 'bg-slate-700 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs border-l border-slate-800 pl-4">
            <span className="text-slate-400">Sliding Window:</span>
            <span className="text-amber-400 font-mono font-semibold">{temporalWindowHours}h</span>
            <input
              type="range"
              min="12"
              max="72"
              step="12"
              value={temporalWindowHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTemporalWindowHours(val);
                fetchGraph(focalId, depth, val);
              }}
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Canvas + Evidence Drawer Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm h-[580px] flex">
        {/* Empty temporal window banner */}
        {graphData && graphData.edges.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center bg-slate-950/90 border border-slate-800 rounded-xl p-4 shadow-xl z-20 max-w-sm">
            <Layers className="w-7 h-7 text-amber-400 mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-slate-200">No Active Edges within {temporalWindowHours}h Window</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Transactions for {focalId} fall outside this time range. Expand the slider (48h/72h) to view historical links.
            </p>
          </div>
        )}
        {/* Graph Legend & Canvas Controls.
            Form as well as hue: five entity classes > the three hues a
            force graph can safely carry, so shape carries identity too and no
            class depends on colour alone. */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs space-y-1.5 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Node Legend:</span>

          <div className="flex items-center space-x-2">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true">
              <polygon points="6,0 3,5.196 -3,5.196 -6,0 -3,-5.196 3,-5.196" fill="#f59e0b" stroke="#020617" strokeWidth="1" />
            </svg>
            <span className="text-slate-300">Canary Honeypot <span className="text-slate-500">(bank decoy)</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true">
              <polygon points="-5,-5 5,-5 5,5 -5,5" fill="#e2e8f0" stroke="#020617" strokeWidth="1" />
            </svg>
            <span className="text-slate-300">Suspected Mule <span className="text-slate-500">(triage flag)</span></span>
          </div>

          <div className="flex items-center space-x-2">
            <svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true">
              <polygon points="6,0 3,5.196 -3,5.196 -6,0 -3,-5.196 3,-5.196" fill="#d95926" stroke="#020617" strokeWidth="1" />
            </svg>
            <span className="text-slate-300">Upstream Feeder</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#3987e5] inline-block" />
            <span className="text-slate-300">Device Token</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#199e70] inline-block" />
            <span className="text-slate-300">Benign Account</span>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed pt-0.5 max-w-[15rem]">
            A suspected mule is a <span className="text-slate-400">triage flag</span>, not a confirmed finding — it carries no hue and a square form, and reads for review.
          </p>
        </div>

        {/* Zoom Buttons */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <button onClick={() => handleZoom(1.2)} className="p-1 hover:bg-slate-800 rounded text-slate-300">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => handleZoom(0.8)} className="p-1 hover:bg-slate-800 rounded text-slate-300">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={handleResetZoom} className="p-1 hover:bg-slate-800 rounded text-slate-300">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* D3 SVG Canvas */}
        <svg ref={svgRef} className="w-full h-full bg-slate-950" />

        {/* Evidence Drawer (Right Panel) */}
        {selectedNode && (
          <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto z-20 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <h4 className="font-semibold text-slate-200 text-xs">Entity Forensic Dossier</h4>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Entity ID:</span>
                <div className="font-mono text-sm font-bold text-amber-300 break-all">{selectedNode.id}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">Classification: <strong className="text-slate-200">{selectedNode.type}</strong></div>
              </div>

              {/* CS-LP Risk Score Gauge */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Canary-Seeded Risk (CS-LP):</span>
                  <span className={`font-mono font-bold ${selectedNode.risk_score > 0.7 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {(selectedNode.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedNode.risk_score > 0.7 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, selectedNode.risk_score * 100)}%` }}
                  />
                </div>
              </div>

              {/* Degrees & Linkage */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">In-Degree:</span>
                  <div className="text-lg font-bold font-mono text-slate-200">{selectedNode.in_degree}</div>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Out-Degree:</span>
                  <div className="text-lg font-bold font-mono text-slate-200">{selectedNode.out_degree}</div>
                </div>
              </div>

              {/* Detected Motifs */}
              {graphData?.detected_motifs && graphData.detected_motifs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Detected Temporal Motifs:</span>
                  </span>
                  {graphData.detected_motifs.map((m, idx) => (
                    <div key={idx} className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded text-xs text-amber-200">
                      <strong className="block text-[10px] text-amber-400 uppercase">{m.type}</strong>
                      <p className="text-[11px] mt-0.5 leading-relaxed">{m.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('workbench')}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1"
            >
              <span>Manage in Workbench</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
