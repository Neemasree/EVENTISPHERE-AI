import { useEffect, useRef } from 'react';
import { useEventStore } from '../../store/eventStore';

interface Person { id: number; x: number; y: number; vx: number; vy: number; color: string; state: string; radius: number; }

const COLORS = ['#00d4ff','#00ff88','#a855f7','#fbbf24','#f97316'];

function createPeople(count: number, W: number, H: number): Person[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * (W - 60),
    y: 30 + Math.random() * (H - 60),
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    state: 'walking',
    radius: 2.5 + Math.random() * 1.5,
  }));
}

export default function LiveCrowdAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const people = useRef<Person[]>([]);
  const rafRef = useRef<number>(0);
  const { kpi, activeScenario } = useEventStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const count = Math.min(Math.floor(kpi.currentCrowd / 40), 120);
    people.current = createPeople(count, W, H);

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, W, H);

      // Zones
      const zones = [
        { x: 10, y: 10, w: 120, h: 55, label: 'Parking', color: 'rgba(0,212,255,0.06)' },
        { x: 10, y: 80, w: 80, h: 45, label: 'Gate A', color: 'rgba(249,115,22,0.08)' },
        { x: 100, y: 165, w: 220, h: 110, label: 'Main Stage', color: 'rgba(168,85,247,0.06)' },
        { x: 340, y: 90, w: 110, h: 70, label: 'Food Court', color: 'rgba(239,68,68,0.08)' },
        { x: 10, y: 295, w: 100, h: 40, label: 'Exit', color: 'rgba(0,255,136,0.06)' },
      ];
      zones.forEach(z => {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.fillStyle = z.color;
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.w, z.h, 6);
        ctx.fill();
        ctx.stroke();
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'left';
        ctx.fillText(z.label, z.x + 6, z.y + 14);
      });

      // Update + draw people
      const isEmergency = activeScenario === 'emergency';
      people.current.forEach(p => {
        if (isEmergency) {
          p.vx = (p.x < W / 2 ? -1 : 1) * (1.5 + Math.random() * 2);
          p.vy = (p.y < H / 2 ? -1 : 1) * (1.5 + Math.random() * 2);
          p.color = '#ef4444';
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < p.radius || p.x > W - p.radius) p.vx *= -1;
        if (p.y < p.radius || p.y > H - p.radius) p.vy *= -1;

        // Density slowing
        const nearby = people.current.filter(q => q.id !== p.id && Math.hypot(q.x - p.x, q.y - p.y) < 15).length;
        const speedMult = Math.max(0.15, 1 - nearby * 0.15);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + 'cc';
        ctx.fill();

        // Trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * speedMult * 6, p.y - p.vy * speedMult * 6);
        ctx.strokeStyle = p.color + '44';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [kpi.currentCrowd, activeScenario]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Live Crowd Animation</span>
          <span className="live-dot" />
        </div>
        <span className="text-xs text-white/40 font-mono">{kpi.currentCrowd.toLocaleString()} visitors</span>
      </div>
      <div className="relative" style={{ paddingBottom: '55%' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
      <div className="px-4 py-2 border-t border-white/8 flex gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />Walking</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Queuing</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Emergency</span>
      </div>
    </div>
  );
}
