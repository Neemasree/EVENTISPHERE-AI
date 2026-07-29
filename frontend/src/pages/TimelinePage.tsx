import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';
import { formatTime } from '../utils/helpers';
import type { TimelineEvent } from '../types';
import { Filter } from 'lucide-react';

const TYPE_CFG: Record<TimelineEvent['type'], { color: string; bg: string; border: string; label: string }> = {
  normal:   { color: '#00f5a0', bg: 'rgba(0,245,160,0.06)',  border: 'rgba(0,245,160,0.15)',  label: 'Normal'   },
  warning:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.18)', label: 'Warning'  },
  action:   { color: '#00d4ff', bg: 'rgba(0,212,255,0.07)',  border: 'rgba(0,212,255,0.18)',  label: 'Action'   },
  resolved: { color: '#60a5fa', bg: 'rgba(96,165,250,0.07)', border: 'rgba(96,165,250,0.18)', label: 'Resolved' },
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.22)',  label: 'Critical' },
};

const AGENT_ICONS: Record<string, string> = {
  orchestrator: '🧠', crowd: '👥', parking: '🚗',
  gate: '🚪', ticket: '🎫', emergency: '🚨', analytics: '📊',
};

const FILTERS = ['all', 'critical', 'warning', 'action', 'resolved', 'normal'] as const;
type FilterType = typeof FILTERS[number];

export default function TimelinePage() {
  const timeline = useEventStore(s => s.timeline);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const items = filter === 'all' ? timeline : timeline.filter(e => e.type === filter);
    return [...items].reverse();
  }, [timeline, filter]);

  const counts = useMemo(() =>
    timeline.reduce((acc, e) => ({ ...acc, [e.type]: (acc[e.type] ?? 0) + 1 }), {} as Record<string, number>),
    [timeline]
  );

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">AI Decision Timeline</h1>
          <p className="page-subtitle">Chronological record of every AI decision, alert, and agent action</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[11px] font-mono text-white/40">{timeline.length} total events</span>
          <span className="live-dot w-1.5 h-1.5" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {(['critical', 'warning', 'action', 'resolved', 'normal'] as const).map(type => {
          const cfg = TYPE_CFG[type];
          const count = counts[type] ?? 0;
          return (
            <div key={type} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</p>
                <p className="text-[14px] font-mono font-bold text-white">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ── Timeline (3/5) ── */}
        <div className="lg:col-span-3 space-y-3">

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter size={11} className="text-white/25" />
            {FILTERS.map(f => {
              const cfg = f !== 'all' ? TYPE_CFG[f] : null;
              const isActive = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={isActive
                    ? { background: cfg ? `${cfg.color}18` : 'rgba(255,255,255,0.1)', color: cfg?.color ?? '#fff', border: `1px solid ${cfg?.color ?? 'rgba(255,255,255,0.3)'}40` }
                    : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {f === 'all' ? `All (${timeline.length})` : `${f} (${counts[f] ?? 0})`}
                </button>
              );
            })}
          </div>

          {/* Timeline list */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="overflow-y-auto max-h-[600px] p-4 space-y-0">
              <AnimatePresence mode="popLayout">
                {filtered.map((evt, i) => {
                  const cfg = TYPE_CFG[evt.type];
                  return (
                    <motion.div key={evt.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      className="flex gap-3 group">
                      {/* Spine */}
                      <div className="flex flex-col items-center flex-shrink-0 w-4">
                        <div className="w-2.5 h-2.5 rounded-full mt-3.5 flex-shrink-0 ring-2 ring-[#020409]"
                          style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}80` }} />
                        {i < filtered.length - 1 && (
                          <div className="w-px flex-1 min-h-[16px] mt-1 opacity-20"
                            style={{ background: cfg.color }} />
                        )}
                      </div>
                      {/* Card */}
                      <div className="flex-1 mb-2.5 p-3 rounded-xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {evt.agent && (
                                <span className="text-sm leading-none select-none">{AGENT_ICONS[evt.agent] ?? '⚙️'}</span>
                              )}
                              <p className="text-[12px] font-bold text-white">{evt.title}</p>
                              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md flex-shrink-0"
                                style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                {cfg.label}
                              </span>
                              {evt.agent && (
                                <span className="text-[9px] text-white/25">{evt.agent}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/50 leading-relaxed">{evt.description}</p>
                          </div>
                          <p className="text-[10px] font-mono text-white/25 flex-shrink-0 mt-0.5">
                            {formatTime(evt.time)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <p className="text-[12px] text-white/20 text-center py-12">No {filter} events yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Agent Comms (2/5) ── */}
        <div className="lg:col-span-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-3">Agent Communications</p>
          <AgentCommsPanel />
        </div>
      </div>
    </div>
  );
}
