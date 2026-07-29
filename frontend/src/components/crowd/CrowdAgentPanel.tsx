import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, Square, Volume2, VolumeX, ChevronDown, ChevronUp, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AnalysisResult {
  status: 'ok' | 'error';
  severity: Severity;
  reason: string;
  recommendations: string[];
  data: {
    queue: number;
    capacity: number;
    projected_queue: number;
    occupancy_pct: number;
  };
  timestamp: string;
}

interface HistoryEntry extends AnalysisResult { id: string }

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV: Record<Severity | 'idle' | 'error', { color: string; bg: string; border: string; label: string }> = {
  LOW:      { color: '#00f5a0', bg: 'rgba(0,245,160,0.07)',  border: 'rgba(0,245,160,0.2)',   label: 'Low'      },
  MEDIUM:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)',  label: 'Medium'   },
  HIGH:     { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', label: 'High'     },
  CRITICAL: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   label: 'Critical' },
  idle:     { color: '#475569', bg: 'rgba(71,85,105,0.06)',  border: 'rgba(71,85,105,0.15)',  label: 'Idle'     },
  error:    { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',  label: 'Error'    },
};

// ─── Stick person (minimal SVG) ───────────────────────────────────────────────
function Person({ color, glow, entering = false, delay = 0 }: {
  color: string; glow: string; entering?: boolean; delay?: number;
}) {
  return (
    <svg width="14" height="28" viewBox="0 0 14 28" fill="none"
      style={{
        filter: `drop-shadow(0 0 2px ${glow}80)`,
        animation: entering
          ? `cpEnter 0.45s ${delay}s cubic-bezier(0.16,1,0.3,1) both`
          : `cpBob 0.9s ${delay}s ease-in-out infinite alternate`,
      }}>
      <circle cx="7" cy="3.5" r="3" fill={color} />
      <line x1="7" y1="6.5" x2="7" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="9.5" x2="2.5" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round"
        style={{ transformOrigin: '7px 9.5px', animation: `cpArmL 0.5s ${delay}s ease-in-out infinite alternate` }} />
      <line x1="7" y1="9.5" x2="11.5" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round"
        style={{ transformOrigin: '7px 9.5px', animation: `cpArmR 0.5s ${delay + 0.25}s ease-in-out infinite alternate` }} />
      <line x1="7" y1="17" x2="4" y2="26" stroke={color} strokeWidth="1.8" strokeLinecap="round"
        style={{ transformOrigin: '7px 17px', animation: `cpLegL 0.5s ${delay}s ease-in-out infinite alternate` }} />
      <line x1="7" y1="17" x2="10" y2="26" stroke={color} strokeWidth="1.8" strokeLinecap="round"
        style={{ transformOrigin: '7px 17px', animation: `cpLegR 0.5s ${delay + 0.25}s ease-in-out infinite alternate` }} />
    </svg>
  );
}

// ─── Venue scene ──────────────────────────────────────────────────────────────
const SLOTS = 32; // 8 cols × 4 rows

function VenueScene({ occupancy, severity }: { occupancy: number; severity: Severity | 'idle' }) {
  const cfg = SEV[severity];
  const filled = Math.round((Math.min(occupancy, 100) / 100) * SLOTS);
  const prevRef = useRef(0);
  const [entering, setEntering] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (filled > prevRef.current) {
      const newOnes = new Set<number>();
      for (let i = prevRef.current; i < filled; i++) newOnes.add(i);
      setEntering(newOnes);
      const t = setTimeout(() => setEntering(new Set()), 1000);
      prevRef.current = filled;
      return () => clearTimeout(t);
    }
    prevRef.current = filled;
  }, [filled]);

  return (
    <div className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

      {/* Critical pulse overlay */}
      {severity === 'CRITICAL' && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: 'rgba(244,63,94,0.06)', animation: 'criticalPulse 1.2s ease-in-out infinite' }} />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">Venue View</span>
        <span className="text-[11px] font-mono font-bold" style={{ color: cfg.color }}>
          {filled}/{SLOTS} slots · {occupancy}%
        </span>
      </div>

      {/* People grid — 8 columns */}
      <div className="grid gap-0.5 mb-3"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {Array.from({ length: SLOTS }, (_, i) => {
          const isOn = i < filled;
          const isNew = entering.has(i);
          return (
            <div key={i} className="flex items-end justify-center" style={{ height: 32 }}>
              {isOn
                ? <Person
                    color={cfg.color}
                    glow={cfg.color}
                    entering={isNew}
                    delay={isNew ? (i - (filled - entering.size)) * 0.06 : (i * 0.035) % 0.7}
                  />
                : <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              }
            </div>
          );
        })}
      </div>

      {/* Occupancy bar */}
      <div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${Math.min(occupancy, 100)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})`, boxShadow: `0 0 6px ${cfg.color}` }}
          />
        </div>
        {/* Threshold markers */}
        <div className="relative h-3 mt-0.5">
          {[{ pct: 70, label: 'MED', color: '#fbbf24' }, { pct: 85, label: 'HIGH', color: '#fb923c' }, { pct: 95, label: 'CRIT', color: '#f43f5e' }].map(m => (
            <div key={m.pct} className="absolute flex flex-col items-center"
              style={{ left: `${m.pct}%`, transform: 'translateX(-50%)' }}>
              <div className="w-px h-1.5" style={{ background: m.color, opacity: 0.5 }} />
              <span className="text-[7px] font-bold" style={{ color: m.color, opacity: 0.6 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CrowdAgentPanel() {
  const [queue,    setQueue]    = useState('185');
  const [capacity, setCapacity] = useState('200');
  const [group,    setGroup]    = useState('');
  const [result,   setResult]   = useState<AnalysisResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [auto,     setAuto]     = useState(false);
  const [muted,    setMuted]    = useState(false);
  const [history,  setHistory]  = useState<HistoryEntry[]>([]);
  const [showHist, setShowHist] = useState(false);
  const autoRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSevRef = useRef<Severity | null>(null);

  const severity = (result?.status === 'error' ? 'error' : result?.severity ?? 'idle') as Severity | 'idle' | 'error';
  const cfg      = SEV[severity];
  const occupancy = result?.data?.occupancy_pct ?? 0;

  // Capacity warning
  const capWarn = (() => {
    const q = parseFloat(queue), c = parseFloat(capacity), g = parseFloat(group) || 0;
    if (!isNaN(q) && !isNaN(c) && g > 0 && q + g > c)
      return `Adding ${g} will exceed capacity by ${Math.round(q + g - c)}`;
    return null;
  })();

  const speak = useCallback((text: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9; u.pitch = 1; u.volume = 0.7;
    window.speechSynthesis.speak(u);
  }, [muted]);

  const analyse = useCallback(async () => {
    if (!queue || !capacity) return;
    setLoading(true);
    try {
      // Try backend; fall back to local calculation
      let data: AnalysisResult;
      try {
        const res = await fetch('/api/crowd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queue: +queue, capacity: +capacity, incoming_group: +(group || 0) }),
        });
        data = await res.json();
      } catch {
        // Local fallback — no backend needed
        const q = parseInt(queue), c = parseInt(capacity), g = parseInt(group) || 0;
        const projected = q + g;
        const pct = Math.round((projected / c) * 100);
        const sev: Severity = pct >= 120 ? 'CRITICAL' : pct >= 100 ? 'HIGH' : pct >= 70 ? 'MEDIUM' : 'LOW';
        const reasons: Record<Severity, string> = {
          LOW:      'Queue within safe limits. Flow is normal.',
          MEDIUM:   'Queue building up. Monitor closely.',
          HIGH:     'Queue approaching capacity. Consider opening alternate gate.',
          CRITICAL: 'Gate limit exceeded! Immediate crowd control required.',
        };
        const recs: Record<Severity, string[]> = {
          LOW:      ['Maintain current gate configuration.'],
          MEDIUM:   ['Pre-position crowd marshals at Gate A.', 'Monitor every 2 minutes.'],
          HIGH:     ['Open Gate B immediately.', 'Deploy crowd barriers.', 'Notify Orchestrator Agent.'],
          CRITICAL: ['Open all gates NOW.', 'Stop inbound flow.', 'Deploy emergency response.', 'Alert all agents.'],
        };
        data = {
          status: 'ok', severity: sev,
          reason: reasons[sev],
          recommendations: recs[sev],
          data: { queue: q, capacity: c, projected_queue: projected, occupancy_pct: Math.min(pct, 120) },
          timestamp: new Date().toISOString(),
        };
      }

      setResult(data);
      if (data.status === 'ok' && data.severity !== prevSevRef.current) {
        if (data.severity === 'CRITICAL') speak('Attention. Gate capacity exceeded. Immediate crowd control required.');
        else if (data.severity === 'HIGH')     speak('Warning. Queue approaching gate capacity.');
        else if (data.severity === 'MEDIUM')   speak('Caution. Queue building up.');
        prevSevRef.current = data.severity;
      }
      if (data.status === 'ok') {
        setQueue(String(data.data.projected_queue));
        setGroup('');
        setHistory(prev => [{ ...data, id: `h_${Date.now()}` }, ...prev.slice(0, 14)]);
      }
    } finally {
      setLoading(false);
    }
  }, [queue, capacity, group, speak]);

  // Auto-polling
  useEffect(() => {
    if (!auto) { if (autoRef.current) clearInterval(autoRef.current); return; }
    autoRef.current = setInterval(() => analyse(), 5000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [auto, analyse]);

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes cpEnter  { from { transform: translateX(24px) scale(0.5); opacity:0; } to { transform:none; opacity:1; } }
        @keyframes cpBob    { from { transform: translateY(0); } to { transform: translateY(-2px); } }
        @keyframes cpArmL   { from { transform: rotate(-18deg); } to { transform: rotate(8deg); } }
        @keyframes cpArmR   { from { transform: rotate(8deg); }  to { transform: rotate(-18deg); } }
        @keyframes cpLegL   { from { transform: rotate(-14deg); } to { transform: rotate(8deg); } }
        @keyframes cpLegR   { from { transform: rotate(8deg); }  to { transform: rotate(-14deg); } }
      `}</style>

      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${severity === 'CRITICAL' ? 'rgba(244,63,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: severity === 'CRITICAL' ? '0 0 30px rgba(244,63,94,0.12)' : '0 4px 24px rgba(0,0,0,0.35)',
          animation: severity === 'CRITICAL' ? 'criticalPulse 2s ease-in-out infinite' : undefined,
        }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}28` }}>
              <Users size={13} style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">Crowd Intelligence Agent</p>
              <p className="text-[9px] text-white/30 mt-0.5 font-mono">Entrance congestion monitor · Agent 1</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {auto && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.2)' }}>
                <span className="live-dot w-1.5 h-1.5" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
              </div>
            )}
            {result && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Venue scene — only after first analyse */}
          {result && result.status === 'ok' && (
            <VenueScene
              occupancy={occupancy}
              severity={(['LOW','MEDIUM','HIGH','CRITICAL'].includes(severity) ? severity : 'idle') as Severity | 'idle'}
            />
          )}

          {/* Form */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Current Queue</p>
              <input
                value={queue}
                onChange={e => setQueue(e.target.value)}
                placeholder="e.g. 185"
                className="input-field text-sm font-mono"
              />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Gate Capacity</p>
              <input
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                placeholder="e.g. 200"
                className="input-field text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">
              Incoming Group <span className="text-white/20 normal-case tracking-normal">(optional)</span>
            </p>
            <input
              value={group}
              onChange={e => setGroup(e.target.value)}
              placeholder="e.g. 20"
              className="input-field text-sm font-mono"
            />
            <AnimatePresence>
              {capWarn && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="text-[11px] mt-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                  ⚠ {capWarn}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={analyse}
              disabled={loading || !queue || !capacity}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all"
              style={{
                background: loading ? 'rgba(255,255,255,0.06)'
                  : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
                color: loading ? 'rgba(255,255,255,0.3)' : '#020409',
                boxShadow: loading ? 'none' : `0 0 20px ${cfg.color}35`,
              }}>
              <Zap size={13} />
              {loading ? 'Analysing…' : 'Analyse'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAuto(v => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
              style={auto ? {
                background: 'rgba(0,245,160,0.1)',
                border: '1px solid rgba(0,245,160,0.3)',
                color: '#00f5a0',
              } : {
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)',
              }}>
              {auto ? <><Square size={11} /> Stop</> : <><Play size={11} /> Auto</>}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setMuted(v => !v)}
              className="px-3.5 py-2.5 rounded-xl text-[12px] transition-all"
              style={muted ? {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.25)',
              } : {
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8',
              }}>
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </motion.button>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && result.status === 'ok' && (
              <motion.div
                key={result.timestamp}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
                className="rounded-xl p-4 space-y-3"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>

                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-white/70 leading-snug">{result.reason}</p>
                  <span className="text-[9px] font-mono text-white/25 flex-shrink-0 ml-3">
                    {result.timestamp?.slice(11, 19)}
                  </span>
                </div>

                {/* 3-stat grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Queue',     value: result.data.queue },
                    { label: 'Capacity',  value: result.data.capacity },
                    { label: 'Projected', value: result.data.projected_queue },
                  ].map(s => (
                    <div key={s.label} className="text-center py-2.5 rounded-xl"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
                      <p className="text-[16px] font-bold font-mono leading-none" style={{ color: cfg.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {result.recommendations.length > 0 && (
                  <ul className="space-y-1">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-white/55">
                        <span style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5">›</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            {result?.status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl p-3.5"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-[12px] text-indigo-400 font-semibold">Connection failed</p>
                <p className="text-[11px] text-white/40 mt-0.5">Running in offline mode — calculations are local.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* History toggle */}
          {history.length > 0 && (
            <div>
              <button
                onClick={() => setShowHist(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.35)',
                }}>
                <span>Alert History ({history.length})</span>
                {showHist ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              <AnimatePresence>
                {showHist && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
                    className="overflow-hidden mt-1 rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="max-h-48 overflow-y-auto">
                      {history.map(entry => {
                        const s = SEV[entry.severity] ?? SEV.idle;
                        return (
                          <div key={entry.id}
                            className="flex items-center gap-3 px-3 py-2.5 text-[11px]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                            <span className="font-bold w-14" style={{ color: s.color }}>{entry.severity}</span>
                            <span className="flex-1 text-white/40 truncate">{entry.reason}</span>
                            <span className="font-mono text-white/25 flex-shrink-0">{entry.data?.occupancy_pct}%</span>
                            <span className="font-mono text-white/20 flex-shrink-0">{entry.timestamp?.slice(11,19)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
