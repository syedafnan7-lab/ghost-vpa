import React, { useEffect, useRef } from 'react';
import { ActiveTab } from '../types';

interface CanaryBackgroundProps {
  activeTab: ActiveTab;
}

interface Node {
  bx: number;
  by: number;
  x: number;
  y: number;
  r: number;
  kind: 'canary' | 'mule' | 'benign';
  phase: number;
  speed: number;
}

interface Packet {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  progress: number;
  speed: number;
}

export const CanaryBackground: React.FC<CanaryBackgroundProps> = ({ activeTab }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tabRef = useRef<ActiveTab>(activeTab);

  useEffect(() => {
    tabRef.current = activeTab;
  }, [activeTab]);

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
    let time = 0;
    let last = performance.now();
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 50 synthetic nodes
    const nodeCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 25 : 55;
    const nodes: Node[] = [];

    // PRNG for consistent node distribution
    let seed = 20261115;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < nodeCount; i++) {
      const isCanary = i === 0 || i === 7;
      const isMule = !isCanary && i % 6 === 0;
      nodes.push({
        bx: random(),
        by: random(),
        x: 0,
        y: 0,
        r: isCanary ? 3.0 : isMule ? 2.0 : 1.2,
        kind: isCanary ? 'canary' : isMule ? 'mule' : 'benign',
        phase: random() * Math.PI * 2,
        speed: 0.2 + random() * 0.4,
      });
    }

    const packets: Packet[] = [];
    let packetTimer = 0;

    const resize = () => {
      if (!canvas) return;
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

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX / Math.max(1, window.innerWidth);
      targetMouseY = e.clientY / Math.max(1, window.innerHeight);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Parallax smooth interpolation
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      const offsetX = (mouseX - 0.5) * 28;
      const offsetY = (mouseY - 0.5) * 28;

      if (!prefersReducedMotion) {
        time += dt;
      }

      ctx.clearRect(0, 0, width, height);

      // Node position updates with gentle harmonic drift
      for (const n of nodes) {
        if (!prefersReducedMotion) {
          const driftX = Math.sin(time * n.speed + n.phase) * 12;
          const driftY = Math.cos(time * n.speed * 0.8 + n.phase) * 12;
          n.x = n.bx * width + driftX + offsetX * (n.r / 3);
          n.y = n.by * height + driftY + offsetY * (n.r / 3);
        } else {
          n.x = n.bx * width;
          n.y = n.by * height;
        }
      }

      // Draw inter-connecting hairline edges
      const linkDist = Math.min(width, height) * 0.18;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.08;
            const hasCanary = a.kind === 'canary' || b.kind === 'canary';

            ctx.strokeStyle = hasCanary 
              ? `rgba(245, 165, 36, ${(alpha * 1.6).toFixed(3)})` 
              : `rgba(148, 163, 184, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            // Spawn occasional telemetry packet along canary links
            if (hasCanary && !prefersReducedMotion && packets.length < 4 && Math.random() < 0.003) {
              packets.push({
                sx: a.x,
                sy: a.y,
                tx: b.x,
                ty: b.y,
                progress: 0,
                speed: 0.6 + Math.random() * 0.8
              });
            }
          }
        }
      }

      // Draw and update active packets
      if (!prefersReducedMotion) {
        for (let p = packets.length - 1; p >= 0; p--) {
          const pkt = packets[p];
          pkt.progress += dt * pkt.speed;
          if (pkt.progress >= 1) {
            packets.splice(p, 1);
            continue;
          }
          const px = pkt.sx + (pkt.tx - pkt.sx) * pkt.progress;
          const py = pkt.sy + (pkt.ty - pkt.sy) * pkt.progress;

          ctx.fillStyle = 'rgba(245, 165, 36, 0.7)';
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw nodes
      for (const n of nodes) {
        if (n.kind === 'canary') {
          // Soft radial glow for canary beacons
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 18);
          glow.addColorStop(0, 'rgba(245, 165, 36, 0.25)');
          glow.addColorStop(1, 'rgba(245, 165, 36, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 18, 0, Math.PI * 2);
          ctx.fill();

          // Reticle ring
          ctx.strokeStyle = 'rgba(245, 165, 36, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Core dot
          ctx.fillStyle = '#F5A524';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (n.kind === 'mule') {
          ctx.fillStyle = 'rgba(240, 68, 56, 0.4)';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(92, 107, 126, 0.35)';
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(render);
      }
    };

    raf = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
};
