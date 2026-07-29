import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor } from '../../utils/helpers';

interface HeatPoint { x: number; y: number; intensity: number; radius: number; }

function buildHeatPoints(zones: ReturnType<typeof useEventStore.getState>['zones']): HeatPoint[] {
  return zones.map(z => ({
    x: (z.x + z.width / 2) / 540,
    y: (z.y + z.height / 2) / 380,
    intensity: z.occupancy / 100,
    radius: Math.max(40, z.occupancy * 0.8),
  }));
}

export default function CrowdHeatmap() {
  const zones = useEventStore(s => s.zones);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Dark base
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Heat blobs
    const pts = buildHeatPoints(zones);
    pts.forEach(pt => {
      const px = pt.x * W, py = pt.y * H;
      const r = pt.radius * (W / 540);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
      const intensity = pt.intensity;

      const color = intensity >= 0.95 ? [239, 68, 68]
        : intensity >= 0.80 ? [249, 115, 22]
        : intensity >= 0.60 ? [251, 191, 36]
        : [0, 255, 136];

      grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${0.55 * intensity + 0.15})`);
      grad.addColorStop(0.5, `rgba(${color[0]},${color[1]},${color[2]},${0.2 * intensity})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    // Labels
    zones.forEach(z => {
      const px = ((z.x + z.width / 2) / 540) * W;
      const py = ((z.y + z.height / 2) / 380) * H;
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = riskColor(z.riskLevel);
      ctx.textAlign = 'center';
      ctx.fillText(z.name, px, py - 4);
      ctx.font = '400 9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(`${z.occupancy}%`, px, py + 10);
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { draw(); }, [zones]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Crowd Heatmap</span>
          <span className="live-dot" />
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          {[['Cool','#00ff88'],['Warm','#fbbf24'],['Hot','#f97316'],['Critical','#ef4444']].map(([l,c]) => (
            <span key={l} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: c }} />
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="relative" style={{ paddingBottom: '62%' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* Animated pulse markers for critical zones */}
        {zones.filter(z => z.riskLevel === 'critical').map(z => (
          <div key={z.id} className="absolute pointer-events-none"
            style={{ left: `${((z.x + z.width / 2) / 540) * 100}%`, top: `${((z.y + z.height / 2) / 380) * 100}%`, transform: 'translate(-50%,-50%)' }}>
            <motion.div className="w-4 h-4 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }} />
          </div>
        ))}
      </div>
    </div>
  );
}
