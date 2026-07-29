import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, FastForward, History, Circle } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { riskColor, occupancyColor } from '../../utils/helpers';
import type { RiskLevel } from '../../types';

interface Frame {
  label: string;
  time: string;
  desc: string;
  visitors: number;
  alerts: number;
  zones: Record<string, { crowd: number; occ: number; risk: RiskLevel }>;
}

const MAX_FRAMES = 20;

export default function EventReplay() {
  const { zones, alerts, kpi, timeline } = useEventStore();

  // ── Record snapshots as the live data ticks ──────────────────────────────
  const [frames, setFrames] = useState<Frame[]>([]);
  const lastRecordRef = useRef(0);

  const recordSnapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastRecordRef.current < 3500) return; // throttle to ~4s intervals
    lastRecordRef.current = now;

    const t = new Date();
    const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const time  = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // pick the most recent timeline event as description
    const lastEvt = [...timeline].reverse()[0];
    const desc = lastEvt ? lastEvt.title : 'Live monitoring active';

    const zoneSnap: Frame['zones'] = {};
    zones.forEach(z => {
      zoneSnap[z.name] = { crowd: z.currentCrowd, occ: z.occupancy, risk: z.riskLevel };
    });

    const frame: Frame = {
      label, time, desc,
      visitors: kpi.currentCrowd,
      alerts:   alerts.filter(a => !a.dismissed).length,
      zones:    zoneSnap,
    };

    setFrames(prev => {
      const next = [...prev, frame];
      return next.length > MAX_FRAMES ? next.slice(next.length - MAX_FRAMES) : next;
    });
  }, [zones, alerts, kpi, timeline]);

  // record on every live tick
  useEffect(() => { recordSnapshot(); }, [kpi.currentCrowd]); // eslint-disable-line

  // ── Playback ──────────────────────────────────────────────────────────────
  const [index,   setIndex]   = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // keep index at latest when not playing
  useEffect(() => {
    if (!playing) setIndex(Math.max(0, frames.length - 1));
  }, [frames.length]); // eslint-disable-line

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
  }, [playing, speed, frames.length]);

  const frame    = frames[index];
  const progress = frames.length > 1 ? (index / (frames.length - 1)) * 100 : 0;

  if (frames.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Circle size={28} className="text-cyan-400 mx-auto mb-3" />
        </motion.div>
        <p className="text-[13px] font-bold text-white/50 mb-1">Recording live data…</p>
        <p className="text-[11px] text-white/25">Snapshots are captured every 4 seconds. Come back in a moment.</p>
      </div>
    );
  }

  const zoneEntries = Object.entries(frame.zones).slice(0, 6);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <History size={15} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Event Replay</p>
            <p className="text-[10px] text-white/30 mt-0.5">{frames.length} snapshots recorded · live</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>
        <span className="text-[10px] font-mono text-white/25 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {frames.length}/{MAX_FRAMES} frames
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Scrubber */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-white/30 font-mono">{frames[0]?.label}</span>
            <motion.span key={frame.time} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="text-sm font-bold font-mono text-cyan-400">
              {frame.time}
            </motion.span>
            <span className="text-[10px] text-white/30 font-mono">{frames[frames.length - 1]?.label}</span>
          </div>

          <div className="relative h-2 rounded-full cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.07)' }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct  = (e.clientX - rect.left) / rect.width;
              setIndex(Math.round(pct * (frames.length - 1)));
            }}>
            <motion.div className="absolute h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.25 }} />
            <motion.div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-cyan-400 bg-white"
              style={{ boxShadow: '0 0 10px rgba(0,212,255,0.6)' }}
              animate={{ left: `calc(${progress}% - 8px)` }} transition={{ duration: 0.25 }} />
          </div>

          <div className="flex justify-between mt-2 overflow-hidden">
            {frames.map((f, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className="text-[8px] font-mono transition-all px-0.5 truncate"
                style={{ color: i === index ? '#00d4ff' : 'rgba(255,255,255,0.15)', maxWidth: 36 }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIndex(0)} className="btn-icon" title="Rewind"><SkipBack size={13} /></button>
            <button onClick={() => setIndex(i => Math.max(0, i - 1))} className="btn-icon">‹</button>
            <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
              onClick={() => { if (index >= frames.length - 1) setIndex(0); setPlaying(p => !p); }}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088cc)', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}>
              {playing
                ? <Pause size={16} style={{ color: '#020409' }} />
                : <Play  size={16} style={{ color: '#020409', marginLeft: '2px' }} />}
            </motion.button>
            <button onClick={() => setIndex(i => Math.min(frames.length - 1, i + 1))} className="btn-icon">›</button>
            <button onClick={() => setIndex(frames.length - 1)} className="btn-icon"><SkipForward size={13} /></button>
          </div>
          <div className="flex items-center gap-2">
            <FastForward size={12} className="text-white/30" />
            {[1, 2, 4].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all"
                style={speed === s ? {
                  background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.35)', color: '#00d4ff',
                } : {
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                }}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Frame detail */}
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-[13px] font-bold text-white">{frame.time} — {frame.desc}</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-white/50 font-mono">👥 {frame.visitors.toLocaleString()}</span>
              <span className={`text-[11px] font-mono font-bold ${frame.alerts > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                🔔 {frame.alerts} alerts
              </span>
            </div>
          </div>

          {zoneEntries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {zoneEntries.map(([name, z]) => {
                const oc = occupancyColor(z.occ);
                const rc = riskColor(z.risk);
                return (
                  <div key={name} className="rounded-xl p-3"
                    style={{ background: `${rc}08`, border: `1px solid ${rc}20` }}>
                    <p className="text-[10px] text-white/40 mb-2 truncate font-semibold">{name}</p>
                    <p className="text-[16px] font-bold font-mono leading-none mb-2" style={{ color: oc }}>{z.occ}%</p>
                    <div className="progress-track">
                      <motion.div className="progress-fill" animate={{ width: `${z.occ}%` }}
                        transition={{ duration: 0.5 }} style={{ background: rc }} />
                    </div>
                    <p className="text-[9px] text-white/25 font-mono mt-1">{z.crowd} people</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-white/25 text-center py-4">No zone data in this snapshot</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
