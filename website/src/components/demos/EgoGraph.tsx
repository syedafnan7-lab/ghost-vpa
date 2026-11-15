import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphNode, ScenarioGraph } from '@/data/graph';

type SimNode = GraphNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & {
  id: string;
  amount: number;
  isTripwire: boolean;
  isDeviceLink: boolean;
  rail: string;
};

interface EgoGraphProps {
  graph: ScenarioGraph;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const WIDTH = 720;
const HEIGHT = 480;

function radiusOf(node: GraphNode): number {
  switch (node.kind) {
    case 'CANARY':
      return 13;
    case 'FEEDER':
      return 11;
    case 'MULE':
      return 10;
    case 'DEVICE':
      return 7;
    default:
      return 5;
  }
}

function nodeFormPath(node: GraphNode): string {
  const r = radiusOf(node);
  if (node.kind === 'CANARY') {
    // Pointy-top hexagon for canary bank decoys
    const pts = [
      [0, r],
      [-0.866 * r, 0.5 * r],
      [-0.866 * r, -0.5 * r],
      [0, -r],
      [0.866 * r, -0.5 * r],
      [0.866 * r, 0.5 * r],
    ];
    return `M${pts.map((p) => p.join(',')).join('L')}Z`;
  }
  if (node.kind === 'MULE') {
    // Square mark for triage flags (REVIEW_REQUIRED)
    const s = r * 0.86;
    return `M${-s},${-s}H${s}V${s}H${-s}Z`;
  }
  // Circular mark for feeder, device, and benign accounts
  return `M${r},0A${r},${r} 0 1,1 ${-r},0A${r},${r} 0 1,1 ${r},0Z`;
}

function colorOf(node: GraphNode): string {
  switch (node.kind) {
    case 'CANARY':
      return '#F5A524'; // Canary amber
    case 'MULE':
      return '#E8EEF7'; // Neutral ink (triage flag)
    case 'FEEDER':
      return '#D95926'; // Upstream feeder orange
    case 'DEVICE':
      return '#38BDF8'; // Shared device blue
    case 'BENIGN':
    default:
      return '#2DD4A7'; // Benign aqua
  }
}

function truncate(value: string, max = 26): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function EgoGraph({ graph, selectedId, onSelect }: EgoGraphProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nodeSelRef = useRef<d3.Selection<SVGGElement, SimNode, SVGGElement, unknown> | null>(null);
  const zoomRef = useRef<{
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
  } | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const root = svg.append('g');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.55, 3.5])
      .on('zoom', (event) => {
        root.attr('transform', event.transform.toString());
      });
    svg.call(zoom);
    zoomRef.current = { svg, zoom };

    const simNodes: SimNode[] = graph.nodes.map((node, i) => {
      const angle = (i / Math.max(1, graph.nodes.length)) * Math.PI * 2;
      return {
        ...node,
        x: WIDTH / 2 + Math.cos(angle) * 160,
        y: HEIGHT / 2 + Math.sin(angle) * 140,
      };
    });
    const simLinks: SimLink[] = graph.edges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
    }));

    const simulation = d3
      .forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => (l.isDeviceLink ? 44 : 88))
          .strength(0.55),
      )
      .force('charge', d3.forceManyBody().strength(-260))
      .force(
        'collide',
        d3.forceCollide<SimNode>().radius((d) => radiusOf(d) + 11).strength(0.85),
      )
      .force('x', d3.forceX(WIDTH / 2).strength(0.05))
      .force('y', d3.forceY(HEIGHT / 2).strength(0.06));

    const linkSel = root
      .append('g')
      .attr('class', 'links')
      .selectAll<SVGLineElement, unknown>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (l) =>
        l.isTripwire ? 'rgba(245,165,36,0.55)' : l.isDeviceLink ? 'rgba(56,189,248,0.22)' : 'rgba(148,163,184,0.2)',
      )
      .attr('stroke-width', (l) => (l.isTripwire ? 1.6 : 1))
      .attr('stroke-dasharray', (l) => (l.isDeviceLink ? '3 4' : null));

    const nodeSel = root
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, unknown>('g')
      .data(simNodes)
      .join('g')
      .attr('class', 'ego-node')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.kind} ${d.label}, risk ${d.risk.toFixed(2)}`)
      .style('cursor', 'pointer');

    // SVG mark using form and hue encoding
    nodeSel
      .append('path')
      .attr('class', 'primary-mark')
      .attr('d', nodeFormPath)
      .attr('fill', colorOf)
      .attr('fill-opacity', (d) => (d.kind === 'BENIGN' ? 0.6 : 0.95))
      .attr('stroke', (d) => (selectedId === d.id ? '#FFFFFF' : '#04070C'))
      .attr('stroke-width', (d) => (selectedId === d.id ? 2.5 : 1.5));

    // Canary pulsating beacon ring
    nodeSel
      .filter((d) => d.kind === 'CANARY')
      .append('circle')
      .attr('r', (d) => radiusOf(d) + 6)
      .attr('fill', 'none')
      .attr('stroke', '#F5A524')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 3')
      .attr('class', 'pulse-dot');
    nodeSel
      .append('text')
      .attr('y', (d) => radiusOf(d) + 17)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9.5)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('fill', (d) => (d.kind === 'BENIGN' ? '#5C6B7E' : '#9AA7B8'))
      .text((d) => (d.kind === 'BENIGN' ? '' : truncate(d.label)));

    nodeSel.append('title').text(
      (d) => `${d.label}\n${d.kind} · risk ${d.risk.toFixed(2)} · ${d.inDegree} in / ${d.outDegree} out`,
    );

    const drag = d3
      .drag<SVGGElement, SimNode>()
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
      });
    nodeSel.call(drag);

    nodeSel.on('click', (event, d) => {
      event.stopPropagation();
      onSelectRef.current(d.id);
    });
    nodeSel.on('keydown', (event, d) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectRef.current(d.id);
      }
    });
    svg.on('click', () => onSelectRef.current(null));

    simulation.on('tick', () => {
      linkSel
        .attr('x1', (l) => (l.source as SimNode).x ?? 0)
        .attr('y1', (l) => (l.source as SimNode).y ?? 0)
        .attr('x2', (l) => (l.target as SimNode).x ?? 0)
        .attr('y2', (l) => (l.target as SimNode).y ?? 0);
      nodeSel.attr('transform', (d) => `translate(${d.x ?? 0}, ${d.y ?? 0})`);
    });

    nodeSelRef.current = nodeSel;
    simulation.alpha(0.9).restart();

    return () => {
      simulation.stop();
      nodeSelRef.current = null;
      zoomRef.current = null;
      svg.selectAll('*').remove();
    };
  }, [graph]);

  useEffect(() => {
    const selection = nodeSelRef.current;
    if (!selection) return;
    selection.classed('is-selected', (d) => d.id === selectedId);
    selection
      .select('path.primary-mark')
      .attr('stroke', (d) => (d.id === selectedId ? '#FFFFFF' : '#04070C'))
      .attr('stroke-width', (d) => (d.id === selectedId ? 2.5 : 1.5));
    selection.select('text').attr('fill', (d) => (d.id === selectedId ? '#E8EEF7' : d.kind === 'BENIGN' ? '#5C6B7E' : '#9AA7B8'));
    selection
      .select('text')
      .text((d) => (d.kind === 'BENIGN' && d.id !== selectedId ? '' : truncate(d.label)));
  }, [selectedId]);

  const zoomBy = (factor: number) => {
    const ctx = zoomRef.current;
    if (!ctx) return;
    ctx.svg.transition().duration(280).call(ctx.zoom.scaleBy, factor);
  };

  const resetZoom = () => {
    const ctx = zoomRef.current;
    if (!ctx) return;
    ctx.svg.transition().duration(320).call(ctx.zoom.transform, d3.zoomIdentity);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full select-none"
        role="application"
        aria-label="Interactive ego network graph. Drag nodes, scroll to zoom, press Enter on a node to inspect it."
      />
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.3)}
          className="border border-line bg-void/80 px-2.5 py-1 font-mono text-caption text-ink2 transition-colors hover:text-ink"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.3)}
          className="border border-line bg-void/80 px-2.5 py-1 font-mono text-caption text-ink2 transition-colors hover:text-ink"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetZoom}
          className="border border-line bg-void/80 px-2.5 py-1 font-mono text-micro text-ink2 transition-colors hover:text-ink"
        >
          reset
        </button>
      </div>
    </div>
  );
}
