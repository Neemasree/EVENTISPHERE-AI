import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor } from '../../utils/helpers';
import { Flame } from 'lucide-react';

function buildHeatPoints(zones: ReturnType<typeof useEventStore.getState>['zones']) {
  return zones.map(z => ({
    x:         (z.x + z.width  / 2) / 540,
    y:         (z.y + z.height / 2) / 380,
    intensity: z.occupancy / 100,
    radius:    Math.max(45, z.occupancy * 0.85),
  }));
}

export default function CrowdHeatmap() {
  const zones     = useEventStore(s => s.zones);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Deep background
    ctx.fillStyle = '#030812';
    ctx.fillRect(0, 0, W, H);

    // Fine grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Heat blobs
    buildHeatPoints(zones).forEach(pt => {
      const px = pt.x * W, py = pt.y * H;
      const rv = pt.radius * (W / 540);
      const g  = ctx.createRadialGradient(px, py, 0, px, py, rv);
      const iv = pt.intensity;

      const [r, gc, b] = iv >= 0.95 ? [244, 63,  94]
        : iv >= 0.80    ? [251, 146, 60]
        : iv >= 0.60    ? [251, 191, 36]
        : [0, 245, 160];

      g.addColorStop(0,   `rgba(${r},${gc},${b},${0.55 * iv + 0.18})`);
      g.addColorStop(0.45,`rgba(${r},${gc},${b},${0.22 * iv})`);
      g.addColorStop(1,   'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(px, py, rv, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    // Zone labels
    zones.forEach(z => {
      const px = ((z.x + z.width  / 2) / 540) * W;
      const py = ((z.y + z.height / 2) / 380) * H;

      ctx.font      = '600 10.5px Inter, sans-serif';
      ctx.fillStyle = riskColor(z.riskLevel);
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur  = 4;
      ctx.fillText(z.name, px, py - 3);

      ctx.font      = '500 9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText(`${z.occupancy}%`, px, py + 11);
      ctx.shadowBlur = 0;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []); // eslint-disable-line

  useEffect(() => { draw(); }, [zones]); // eslint-disable-line

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
            style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <Flame size={13} className="text-orange-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Crowd Heatmap</p>
            <p className="text-[9px] text-white/30 mt-0.5">Live density — updates every 4s</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {[['Cool', '#00f5a0'], ['Warm', '#fbbf24'], ['Hot', '#fb923c'], ['Critical', '#f43f5e']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
              <span className="text-[10px] text-white/40 hidden sm:inline">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ paddingBottom: '42%' }}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Critical zone pulse rings */}
        {zones.filter(z => z.riskLevel === 'critical').map(z => (
          <div key={z.id} className="absolute pointer-events-none"
            style={{
              left: `${((z.x + z.width  / 2) / 540) * 100}%`,
              top:  `${((z.y + z.height / 2) / 380) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}>
            <motion.div
              className="w-5 h-5 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 2.8], opacity: [0.8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 w-5 h-5 rounded-full border border-red-300"
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
