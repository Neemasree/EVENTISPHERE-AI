import { useEffect, useRef } from 'react';
import { useEventStore } from '../../store/eventStore';
import { Activity } from 'lucide-react';

interface Person {
  id: number; x: number; y: number;
  vx: number; vy: number;
  color: string; radius: number;
}

const COLORS = ['#00d4ff', '#00f5a0', '#a855f7', '#fbbf24', '#fb923c'];

function createPeople(count: number, W: number, H: number): Person[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x:  30 + Math.random() * (W - 60),
    y:  30 + Math.random() * (H - 60),
    vx: (Math.random() - 0.5) * 1.4,
    vy: (Math.random() - 0.5) * 1.4,
    color:  COLORS[i % COLORS.length],
    radius: 2.5 + Math.random() * 1.5,
  }));
}

export default function LiveCrowdAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const peopleRef = useRef<Person[]>([]);
  const rafRef    = useRef<number>(0);
  const { kpi, activeScenario } = useEventStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width  = W;
    canvas.height = H;

    const count = Math.min(Math.floor(kpi.currentCrowd / 40), 140);
    peopleRef.current = createPeople(count, W, H);

    const zones = [
      { x: 10, y: 10,  w: 120, h: 55,  label: 'Parking',    color: 'rgba(0,212,255,0.05)'   },
      { x: 10, y: 78,  w: 80,  h: 45,  label: 'Gate A',     color: 'rgba(251,146,60,0.07)'  },
      { x: 100,y: 162, w: 220, h: 110, label: 'Main Stage', color: 'rgba(168,85,247,0.05)'  },
      { x: 340,y: 88,  w: 110, h: 70,  label: 'Food Court', color: 'rgba(244,63,94,0.07)'   },
      { x: 10, y: 290, w: 100, h: 40,  label: 'Exit',       color: 'rgba(0,245,160,0.05)'   },
    ];

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#030812';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth   = 0.5;
      for (let x = 0; x < W; x += 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Zone areas
      zones.forEach(z => {
        ctx.fillStyle   = z.color;
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        (ctx as any).roundRect?.(z.x, z.y, z.w, z.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font      = '9px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.textAlign = 'left';
        ctx.fillText(z.label, z.x + 6, z.y + 14);
      });

      const isEmergency = activeScenario === 'emergency';

      peopleRef.current.forEach(p => {
        if (isEmergency) {
          p.vx    = (p.x < W / 2 ? -1.2 : 1.2) * (1.5 + Math.random() * 2);
          p.vy    = (p.y < H / 2 ? -1.2 : 1.2) * (1.5 + Math.random() * 2);
          p.color = '#f43f5e';
        }

        // Nearby density slowdown
        const nearby = peopleRef.current.filter(q =>
          q.id !== p.id && Math.hypot(q.x - p.x, q.y - p.y) < 14
        ).length;
        const sm = Math.max(0.2, 1 - nearby * 0.12);

        p.x += p.vx * sm;
        p.y += p.vy * sm;
        if (p.x < p.radius || p.x > W - p.radius) p.vx *= -1;
        if (p.y < p.radius || p.y > H - p.radius) p.vy *= -1;

        // Trail
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * sm * 5, p.y - p.vy * sm * 5);
        ctx.strokeStyle = `${p.color}40`;
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}cc`;
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [kpi.currentCrowd, activeScenario]); // eslint-disable-line

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Activity size={13} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Live Crowd Animation</p>
            <p className="text-[9px] text-white/30 mt-0.5">Particle simulation of current crowd distribution</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>
        <span className="text-[11px] font-mono text-white/40 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {kpi.currentCrowd.toLocaleString()} visitors
        </span>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ paddingBottom: '52%' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Legend */}
      <div className="px-5 py-3 flex gap-5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {[
          ['Walking',   '#00d4ff'],
          ['Queuing',   '#fbbf24'],
          ['Emergency', '#f43f5e'],
        ].map(([l, c]) => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
            <span className="text-[10px] text-white/40">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
