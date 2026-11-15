import { useEffect, useRef } from 'react';
import { PALETTE } from '@/lib/palette';
import { useReducedMotion } from '@/lib/hooks';

export type FieldMode =
  | 'idle'
  | 'problem'
  | 'shift'
  | 'tripwire'
  | 'graph'
  | 'evidence'
  | 'benchmark'
  | 'architecture'
  | 'boundaries';

interface ModeParams {
  link: number;
  speed: number;
  glow: number;
  alarm: number;
  cluster: number;
  packet: number;
}

const MODES: Record<FieldMode, ModeParams> = {
  idle: { link: 0.5, speed: 0.35, glow: 0.75, alarm: 0, cluster: 0.05, packet: 0 },
  problem: { link: 0.32, speed: 0.95, glow: 0.5, alarm: 0.4, cluster: 0.0, packet: 0 },
  shift: { link: 0.6, speed: 0.3, glow: 1.0, alarm: 0, cluster: 0.18, packet: 0 },
  tripwire: { link: 0.62, speed: 0.5, glow: 1.0, alarm: 0.0, cluster: 0.12, packet: 1 },
  graph: { link: 0.9, speed: 0.4, glow: 0.9, alarm: 0, cluster: 0.55, packet: 0 },
  evidence: { link: 0.5, speed: 0.25, glow: 0.85, alarm: 0, cluster: 0.2, packet: 0 },
  benchmark: { link: 0.3, speed: 0.3, glow: 0.6, alarm: 0, cluster: 0.0, packet: 0 },
  architecture: { link: 0.42, speed: 0.3, glow: 0.72, alarm: 0, cluster: 0.35, packet: 0 },
  boundaries: { link: 0.5, speed: 0.22, glow: 0.7, alarm: 0, cluster: 0.1, packet: 0 },
};

interface FieldNode {
  bx: number;
  by: number;
  x: number;
  y: number;
  r: number;
  kind: 'benign' | 'mule' | 'canary';
  phase: number;
  amp: number;
  speed: number;
}

interface Packet {
  sx: number;
  sy: number;
  t: number;
  dur: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function CanaryField({ mode }: { mode: FieldMode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<FieldMode>(mode);
  const reduced = useReducedMotion();

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let last = performance.now();
    let time = 0;
    let flash = 0;
    let packetCooldown = 0;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let parallaxX = 0;
    let parallaxY = 0;

    const params = { ...MODES.idle };
    const target = { ...MODES.idle };

    const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
    const nodeCount = isSmall ? 42 : 96;
    const rand = mulberry32(20261115);

    const nodes: FieldNode[] = [];
    const canaryIndex = 0;
    nodes.push({
      bx: 0.68,
      by: 0.46,
      x: 0,
      y: 0,
      r: 3.4,
      kind: 'canary',
      phase: rand() * Math.PI * 2,
      amp: 0.4,
      speed: 0.4,
    });
    for (let i = 1; i < nodeCount; i += 1) {
      const kind = i % 17 === 0 ? 'mule' : 'benign';
      nodes.push({
        bx: rand(),
        by: rand(),
        x: 0,
        y: 0,
        r: kind === 'mule' ? 1.6 + rand() * 1.2 : 1.0 + rand() * 1.3,
        kind,
        phase: rand() * Math.PI * 2,
        amp: 0.4 + rand() * 0.8,
        speed: 0.3 + rand() * 0.9,
      });
    }

    const packets: Packet[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const node of nodes) {
        node.x = node.bx * width;
        node.y = node.by * height;
      }
    };

    const applyMode = (next: FieldMode) => {
      Object.assign(target, MODES[next]);
    };

    const drawStatic = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      const minDim = Math.min(width, height);
      const linkDist = minDim * 0.16;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.1;
            ctx.strokeStyle = `rgba(148,163,184,${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const node of nodes) {
        if (node.kind === 'canary') {
          const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, minDim * 0.09);
          halo.addColorStop(0, 'rgba(245,165,36,0.22)');
          halo.addColorStop(1, 'rgba(245,165,36,0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(node.x, node.y, minDim * 0.09, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(245,165,36,0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = PALETTE.canary;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (node.kind === 'mule') {
          ctx.fillStyle = `rgba(240,68,56,${0.35})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(58,74,94,0.85)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt * (0.4 + params.speed);

      // Ease mode parameters toward the active chapter.
      applyMode(modeRef.current);
      params.link += (target.link - params.link) * 0.045;
      params.speed += (target.speed - params.speed) * 0.045;
      params.glow += (target.glow - params.glow) * 0.045;
      params.alarm += (target.alarm - params.alarm) * 0.045;
      params.cluster += (target.cluster - params.cluster) * 0.045;
      params.packet += (target.packet - params.packet) * 0.045;

      parallaxX += (pointerX - 0.5 - parallaxX) * 0.04;
      parallaxY += (pointerY - 0.5 - parallaxY) * 0.04;

      const minDim = Math.min(width, height);
      const canary = nodes[canaryIndex];
      const canaryX = canary.bx * width;
      const canaryY = canary.by * height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(parallaxX * 14, parallaxY * 10);

      // Update node positions.
      for (const node of nodes) {
        const driftX = Math.sin(time * node.speed + node.phase) * node.amp * minDim * 0.018;
        const driftY = Math.cos(time * node.speed * 0.8 + node.phase) * node.amp * minDim * 0.018;
        let tx = node.bx * width + driftX;
        let ty = node.by * height + driftY;
        if (node.kind !== 'canary' && params.cluster > 0.01) {
          const spread = minDim * (0.42 - params.cluster * 0.22);
          tx += canaryX * params.cluster * 0.24 + (node.bx - 0.5) * spread * params.cluster * 0.24;
          ty += canaryY * params.cluster * 0.24 + (node.by - 0.5) * spread * params.cluster * 0.24;
        }
        node.x += (tx - node.x) * 0.045;
        node.y += (ty - node.y) * 0.045;
      }

      // Repulsion + links in one pass.
      const linkDist = minDim * 0.16;
      const repelDist = 42;
      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < repelDist) {
            const push = ((repelDist - d) / repelDist) * 0.35;
            const nx = dx / d;
            const ny = dy / d;
            a.x += nx * push;
            a.y += ny * push;
            b.x -= nx * push;
            b.y -= ny * push;
          }
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.11 * params.link;
            if (alpha > 0.004) {
              ctx.strokeStyle = `rgba(148,163,184,${alpha.toFixed(3)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // Tripwire packets: a mule probe travelling to the canary.
      if (params.packet > 0.05) {
        packetCooldown -= dt;
        if (packetCooldown <= 0 && packets.length < 3) {
          const mules = nodes.filter((n) => n.kind === 'mule');
          const from = mules[Math.floor(Math.random() * mules.length)] ?? nodes[1];
          packets.push({ sx: from.x, sy: from.y, t: 0, dur: 1.5 });
          packetCooldown = 1.4 + Math.random() * 0.8;
        }
      }
      for (let i = packets.length - 1; i >= 0; i -= 1) {
        const p = packets[i];
        p.t += dt / p.dur;
        if (p.t >= 1) {
          packets.splice(i, 1);
          flash = 1;
          continue;
        }
        const eased = 1 - Math.pow(1 - p.t, 3);
        const px = p.sx + (canary.x - p.sx) * eased;
        const py = p.sy + (canary.y - p.sy) * eased;
        ctx.strokeStyle = `rgba(245,165,36,${0.35 * params.packet})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = `rgba(245,165,36,${0.9 * params.packet})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Alarm flash on canary arrival.
      if (flash > 0.01) {
        ctx.strokeStyle = `rgba(240,68,56,${(flash * 0.7).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(canary.x, canary.y, 16 + (1 - flash) * 46, 0, Math.PI * 2);
        ctx.stroke();
        flash *= 0.94;
      }

      // Nodes.
      for (const node of nodes) {
        if (node.kind === 'canary') {
          const haloRadius = minDim * (0.06 + params.glow * 0.05);
          const halo = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloRadius);
          halo.addColorStop(0, `rgba(245,165,36,${(0.16 + params.glow * 0.14).toFixed(3)})`);
          halo.addColorStop(1, 'rgba(245,165,36,0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(245,165,36,${(0.35 + params.glow * 0.3).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 11 + params.glow * 2, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle ticks, slowly rotating.
          const rot = time * 0.25;
          for (let k = 0; k < 4; k += 1) {
            const angle = rot + (k * Math.PI) / 2;
            const r1 = 15 + params.glow * 2;
            const r2 = r1 + 5;
            ctx.strokeStyle = `rgba(245,165,36,${(0.4 + params.glow * 0.3).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(node.x + Math.cos(angle) * r1, node.y + Math.sin(angle) * r1);
            ctx.lineTo(node.x + Math.cos(angle) * r2, node.y + Math.sin(angle) * r2);
            ctx.stroke();
          }

          ctx.fillStyle = PALETTE.canary;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (node.kind === 'mule') {
          const alpha = 0.22 + params.alarm * 0.5;
          ctx.fillStyle = `rgba(240,68,56,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(58,74,94,0.8)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(frame);
    };

    const onPointer = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, window.innerWidth);
      pointerY = event.clientY / Math.max(1, window.innerHeight);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    if (reduced) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(frame);
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
    }
    window.addEventListener('resize', resize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-70"
    />
  );
}
