import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { riskColor, occupancyColor } from '../../utils/helpers';
import type { RiskLevel } from '../../types';

interface Frame {
  label: string;
  time: string;
  desc: string;
  zones: Record<string, { crowd: number; occ: number; risk: RiskLevel }>;
  visitors: number;
  alerts: number;
}

const frames: Frame[] = [
  { label: '14:00', time: '2:00 PM', desc: 'Gates open. First visitors arriving.', visitors: 1200, alerts: 0,
    zones: { 'Gate A': { crowd: 60, occ: 12, risk: 'low' }, 'Food Court': { crowd: 40, occ: 7, risk: 'low' }, 'Main Stage': { crowd: 400, occ: 8, risk: 'low' }, 'Parking A': { crowd: 180, occ: 36, risk: 'low' } } },
  { label: '15:00', time: '3:00 PM', desc: 'Steady inflow. Parking A reaching 60%.', visitors: 3400, alerts: 1,
    zones: { 'Gate A': { crowd: 280, occ: 56, risk: 'medium' }, 'Food Court': { crowd: 200, occ: 33, risk: 'low' }, 'Main Stage': { crowd: 1800, occ: 36, risk: 'low' }, 'Parking A': { crowd: 300, occ: 60, risk: 'medium' } } },
  { label: '16:00', time: '4:00 PM', desc: 'Bus arrival at Gate A. AI alert generated.', visitors: 5800, alerts: 2,
    zones: { 'Gate A': { crowd: 450, occ: 90, risk: 'critical' }, 'Food Court': { crowd: 380, occ: 63, risk: 'medium' }, 'Main Stage': { crowd: 2800, occ: 56, risk: 'medium' }, 'Parking A': { crowd: 400, occ: 80, risk: 'high' } } },
  { label: '16:13', time: '4:13 PM', desc: 'Gate C opened. Crowd redistributed.', visitors: 5900, alerts: 1,
    zones: { 'Gate A': { crowd: 320, occ: 64, risk: 'medium' }, 'Food Court': { crowd: 420, occ: 70, risk: 'high' }, 'Main Stage': { crowd: 3000, occ: 60, risk: 'medium' }, 'Parking A': { crowd: 420, occ: 84, risk: 'high' } } },
  { label: '17:00', time: '5:00 PM', desc: 'Concert starts. Main Stage surges.', visitors: 7200, alerts: 2,
    zones: { 'Gate A': { crowd: 380, occ: 76, risk: 'high' }, 'Food Court': { crowd: 520, occ: 87, risk: 'critical' }, 'Main Stage': { crowd: 4000, occ: 80, risk: 'high' }, 'Parking A': { crowd: 450, occ: 90, risk: 'critical' } } },
  { label: '18:00', time: '6:00 PM', desc: 'Peak attendance. All agents on alert.', visitors: 8100, alerts: 4,
    zones: { 'Gate A': { crowd: 420, occ: 84, risk: 'high' }, 'Food Court': { crowd: 580, occ: 97, risk: 'critical' }, 'Main Stage': { crowd: 4800, occ: 96, risk: 'critical' }, 'Parking A': { crowd: 490, occ: 98, risk: 'critical' } } },
  { label: '19:00', time: '7:00 PM', desc: 'Crowd stabilising. Recommendations applied.', visitors: 7600, alerts: 2,
    zones: { 'Gate A': { crowd: 340, occ: 68, risk: 'medium' }, 'Food Court': { crowd: 440, occ: 73, risk: 'high' }, 'Main Stage': { crowd: 4200, occ: 84, risk: 'high' }, 'Parking A': { crowd: 460, occ: 92, risk: 'critical' } } },
  { label: '20:00', time: '8:00 PM', desc: 'Event ending. Evacuation flow active.', visitors: 5200, alerts: 1,
    zones: { 'Gate A': { crowd: 200, occ: 40, risk: 'low' }, 'Food Court': { crowd: 200, occ: 33, risk: 'low' }, 'Main Stage': { crowd: 2200, occ: 44, risk: 'low' }, 'Parking A': { crowd: 380, occ: 76, risk: 'high' } } },
  { label: '21:00', time: '9:00 PM', desc: 'Venue cleared. Event complete.', visitors: 1400, alerts: 0,
    zones: { 'Gate A': { crowd: 30, occ: 6, risk: 'low' }, 'Food Court': { crowd: 50, occ: 8, risk: 'low' }, 'Main Stage': { crowd: 400, occ: 8, risk: 'low' }, 'Parking A': { crowd: 120, occ: 24, risk: 'low' } } },
];

export default function EventReplay() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frame = frames[index];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIndex(i => {
          if (i >= frames.length - 1) { setPlaying(false); return i; }
          return i + 1;
        });
      }, 1800 / speed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, speed]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/8">
        <p className="text-sm font-semibold text-white">Event Replay</p>
        <p className="text-xs text-white/40 mt-0.5">Scrub through the event timeline and watch crowd dynamics unfold</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Timeline scrubber */}
        <div>
          <div className="flex items-center justify-between text-xs text-white/40 mb-2">
            <span>{frames[0].time}</span>
            <span className="text-white font-mono text-sm font-bold">{frame.time}</span>
            <span>{frames[frames.length - 1].time}</span>
          </div>
          <div className="relative h-2 bg-white/8 rounded-full cursor-pointer"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              setIndex(Math.round(pct * (frames.length - 1)));
            }}>
            <motion.div className="absolute h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
              animate={{ width: `${(index / (frames.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }} />
            <motion.div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-lg"
              animate={{ left: `calc(${(index / (frames.length - 1)) * 100}% - 8px)` }}
              transition={{ duration: 0.3 }} />
          </div>
          {/* Tick marks */}
          <div className="flex justify-between mt-1">
            {frames.map((f, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className={`text-[9px] font-mono transition-colors ${i === index ? 'text-cyan-400' : 'text-white/25 hover:text-white/50'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIndex(0)} className="btn-ghost p-2"><SkipBack size={14} /></button>
            <button onClick={() => setIndex(i => Math.max(0, i - 1))} className="btn-ghost p-2">‹</button>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { if (index >= frames.length - 1) setIndex(0); setPlaying(p => !p); }}
              className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 16px rgba(0,212,255,0.4)' }}>
              {playing ? <Pause size={16} className="text-dark-900" /> : <Play size={16} className="text-dark-900 ml-0.5" />}
            </motion.button>
            <button onClick={() => setIndex(i => Math.min(frames.length - 1, i + 1))} className="btn-ghost p-2">›</button>
            <button onClick={() => setIndex(frames.length - 1)} className="btn-ghost p-2"><SkipForward size={14} /></button>
          </div>
          <div className="flex items-center gap-2">
            <FastForward size={12} className="text-white/40" />
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-1 rounded-lg transition-all ${speed === s ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'}`}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Frame info */}
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-white">{frame.time} — {frame.desc}</p>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>👥 {frame.visitors.toLocaleString()}</span>
              <span className={frame.alerts > 0 ? 'text-orange-400' : 'text-green-400'}>🔔 {frame.alerts} alerts</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(frame.zones).map(([name, z]) => (
              <div key={name} className="bg-white/5 rounded-lg p-2.5">
                <p className="text-[10px] text-white/50 mb-1 truncate">{name}</p>
                <p className="text-sm font-bold font-mono" style={{ color: occupancyColor(z.occ) }}>{z.occ}%</p>
                <div className="h-1 bg-white/8 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${z.occ}%`, background: riskColor(z.risk) }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
