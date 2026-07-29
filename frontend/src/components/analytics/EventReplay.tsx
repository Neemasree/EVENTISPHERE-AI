import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, FastForward, History } from 'lucide-react';
import { riskColor, occupancyColor } from '../../utils/helpers';
import type { RiskLevel } from '../../types';

interface Frame {
  label: string; time: string; desc: string;
  zones: Record<string, { crowd: number; occ: number; risk: RiskLevel }>;
  visitors: number; alerts: number;
}

const frames: Frame[] = [
  { label: '14:00', time: '2:00 PM', desc: 'Gates open — first visitors arriving.', visitors: 1200, alerts: 0,
    zones: { 'Gate A': { crowd: 60, occ: 12, risk: 'low' }, 'Food Court': { crowd: 40, occ: 7, risk: 'low' }, 'Main Stage': { crowd: 400, occ: 8, risk: 'low' }, 'Parking A': { crowd: 180, occ: 36, risk: 'low' } } },
  { label: '15:00', time: '3:00 PM', desc: 'Steady inflow. Parking A reaching 60%.', visitors: 3400, alerts: 1,
    zones: { 'Gate A': { crowd: 280, occ: 56, risk: 'medium' }, 'Food Court': { crowd: 200, occ: 33, risk: 'low' }, 'Main Stage': { crowd: 1800, occ: 36, risk: 'low' }, 'Parking A': { crowd: 300, occ: 60, risk: 'medium' } } },
  { label: '16:00', time: '4:00 PM', desc: 'Bus arrival at Gate A. AI alert generated.', visitors: 5800, alerts: 2,
    zones: { 'Gate A': { crowd: 450, occ: 90, risk: 'critical' }, 'Food Court': { crowd: 380, occ: 63, risk: 'medium' }, 'Main Stage': { crowd: 2800, occ: 56, risk: 'medium' }, 'Parking A': { crowd: 400, occ: 80, risk: 'high' } } },
  { label: '16:13', time: '4:13 PM', desc: 'Gate C opened by AI. Crowd redistributed.', visitors: 5900, alerts: 1,
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
  const [index,   setIndex]   = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState(1);
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

  const progress = (index / (frames.length - 1)) * 100;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <History size={15} style={{ color: '#a855f7' }} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white leading-none">Event Replay</p>
          <p className="text-[10px] text-white/30 mt-0.5">Scrub through the event timeline and watch dynamics unfold</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Scrubber */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 font-mono">{frames[0].time}</span>
            <motion.span
              key={frame.time}
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-sm font-bold font-mono text-cyan-400">
              {frame.time}
            </motion.span>
            <span className="text-[10px] text-white/30 font-mono">{frames[frames.length - 1].time}</span>
          </div>

          {/* Track */}
          <div
            className="relative h-2 rounded-full cursor-pointer group"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct  = (e.clientX - rect.left) / rect.width;
              setIndex(Math.round(pct * (frames.length - 1)));
            }}>
            {/* Fill */}
            <motion.div
              className="absolute h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25 }}
            />
            {/* Thumb */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 bg-white shadow-lg"
              style={{ boxShadow: '0 0 10px rgba(0,212,255,0.6)' }}
              animate={{ left: `calc(${progress}% - 8px)` }}
              transition={{ duration: 0.25 }}
            />
          </div>

          {/* Tick labels */}
          <div className="flex justify-between mt-2">
            {frames.map((f, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className="text-[9px] font-mono transition-all duration-200 px-0.5"
                style={{ color: i === index ? '#00d4ff' : 'rgba(255,255,255,0.2)' }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIndex(0)} className="btn-icon" title="Rewind">
              <SkipBack size={13} />
            </button>
            <button onClick={() => setIndex(i => Math.max(0, i - 1))} className="btn-icon" title="Step back">
              <span className="text-sm font-bold">‹</span>
            </button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => { if (index >= frames.length - 1) setIndex(0); setPlaying(p => !p); }}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #0088cc)',
                boxShadow: '0 0 20px rgba(0,212,255,0.35)',
              }}>
              {playing
                ? <Pause size={16} style={{ color: '#020409' }} />
                : <Play  size={16} style={{ color: '#020409', marginLeft: '2px' }} />
              }
            </motion.button>
            <button onClick={() => setIndex(i => Math.min(frames.length - 1, i + 1))} className="btn-icon" title="Step forward">
              <span className="text-sm font-bold">›</span>
            </button>
            <button onClick={() => setIndex(frames.length - 1)} className="btn-icon" title="End">
              <SkipForward size={13} />
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-2">
            <FastForward size={12} className="text-white/30" />
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                style={speed === s ? {
                  background: 'rgba(0,212,255,0.15)',
                  border: '1px solid rgba(0,212,255,0.35)',
                  color: '#00d4ff',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Frame detail card */}
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[13px] font-bold text-white">{frame.time} — {frame.desc}</p>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-white/50 font-mono">
                👥 {frame.visitors.toLocaleString()}
              </span>
              <span className={`flex items-center gap-1.5 text-[11px] font-mono font-bold ${frame.alerts > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                🔔 {frame.alerts} alerts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(frame.zones).map(([name, z]) => {
              const oc = occupancyColor(z.occ);
              const rc = riskColor(z.risk);
              return (
                <div key={name} className="rounded-xl p-3"
                  style={{ background: `${rc}08`, border: `1px solid ${rc}20` }}>
                  <p className="text-[10px] text-white/40 mb-2 truncate font-semibold">{name}</p>
                  <p className="text-[16px] font-bold font-mono leading-none mb-2" style={{ color: oc }}>{z.occ}%</p>
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      animate={{ width: `${z.occ}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ background: rc }}
                    />
                  </div>
                  <p className="text-[9px] text-white/25 font-mono mt-1">{z.crowd} people</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
