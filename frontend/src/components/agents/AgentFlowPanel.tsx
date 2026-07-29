import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { AgentType } from '../../types';
import { formatTime } from '../../utils/helpers';
import { ArrowRight, Zap, Radio } from 'lucide-react';

/* ─── Agent metadata ─────────────────────────────────────────────────────── */
const AGENT_META: Record<AgentType, { color: string; icon: string; short: string }> = {
  orchestrator: { color: '#00d4ff', icon: '🧠', short: 'Orch'       },
  crowd:        { color: '#a855f7', icon: '👥', short: 'Crowd'      },
  parking:      { color: '#fbbf24', icon: '🚗', short: 'Parking'    },
  gate:         { color: '#00f5a0', icon: '🚪', short: 'Gate'       },
  ticket:       { color: '#60a5fa', icon: '🎫', short: 'Ticket'     },
  emergency:    { color: '#f43f5e', icon: '🚨', short: 'Emergency'  },
  analytics:    { color: '#fb923c', icon: '📊', short: 'Analytics'  },
};

const TYPE_STYLE: Record<string, { bg: string; border: string; label: string; color: string }> = {
  info:     { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', label: 'INFO',    color: 'rgba(255,255,255,0.35)' },
  warning:  { bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)',  label: 'WARN',    color: '#fbbf24' },
  action:   { bg: 'rgba(0,212,255,0.07)',   border: 'rgba(0,212,255,0.2)',   label: 'ACTION',  color: '#00d4ff' },
  response: { bg: 'rgba(0,245,160,0.06)',   border: 'rgba(0,245,160,0.18)', label: 'RESP',    color: '#00f5a0' },
};

/* ─── Seed flag ──────────────────────────────────────────────────────────── */
let _seeded = false;

const SEED_MSGS = [
  { from: 'crowd',        to: 'orchestrator', message: 'Gate A at 76%. Queue building — requesting redistribution.', type: 'warning',  ts: -15 },
  { from: 'orchestrator', to: 'gate',         message: 'Acknowledged. Open Gate C to absorb Gate A load.',           type: 'action',   ts: -14 },
  { from: 'gate',         to: 'orchestrator', message: 'Gate C opened. Signage updated. Monitoring.',                type: 'response', ts: -13 },
  { from: 'crowd',        to: 'orchestrator', message: 'Food Court at 87%. Overflow in 4 minutes.',                  type: 'warning',  ts: -8  },
  { from: 'orchestrator', to: 'crowd',        message: 'Recommendation queued: Open Food Stall 3.',                  type: 'action',   ts: -7  },
  { from: 'parking',      to: 'orchestrator', message: 'Parking A at 84%. Rerouting to Lot B.',                      type: 'info',     ts: -5  },
  { from: 'orchestrator', to: 'analytics',    message: 'Log all events for post-event analysis.',                    type: 'action',   ts: -2  },
];

export default function AgentFlowPanel() {
  const { agentMessages, addAgentMessage } = useEventStore();
  const endRef  = useRef<HTMLDivElement>(null);
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  useEffect(() => {
    if (_seeded) return;
    _seeded = true;
    const now = Date.now();
    SEED_MSGS.forEach((m, i) => {
      setTimeout(() => {
        addAgentMessage({
          id: `seed_${now}_${i}`,
          from: m.from as AgentType, to: m.to as AgentType,
          message: m.message, type: m.type as any,
          timestamp: new Date(now + m.ts * 60000), animated: false,
        });
      }, i * 80);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  // Highlight new animated messages
  useEffect(() => {
    const last = agentMessages[agentMessages.length - 1];
    if (last?.animated) {
      setActiveFlow(last.id);
      setTimeout(() => setActiveFlow(null), 2500);
    }
  }, [agentMessages]);

  const msgs = agentMessages.slice(-8);

  return (
    <div className="rounded-2xl overflow-hidden h-full"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Radio size={13} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Agent Communications</p>
            <p className="text-[9px] text-white/30 mt-0.5 font-mono">Live inter-agent message feed</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>
        <span className="text-[10px] font-mono text-white/30 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {agentMessages.length} msgs
        </span>
      </div>

      {/* Agent nodes row */}
      <div className="flex items-center justify-between px-4 py-3 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
        {(Object.entries(AGENT_META) as [AgentType, typeof AGENT_META[AgentType]][]).map(([id, meta]) => (
          <div key={id} className="flex flex-col items-center gap-1 flex-shrink-0 px-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
              style={{
                background: `${meta.color}12`,
                border: `1px solid ${meta.color}30`,
                boxShadow: agentMessages[agentMessages.length - 1]?.from === id
                  ? `0 0 12px ${meta.color}60` : 'none',
              }}>
              {meta.icon}
            </div>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider">{meta.short}</span>
          </div>
        ))}
      </div>

      {/* Message feed */}
      <div className="overflow-y-auto p-3 space-y-1.5 max-h-72">
        <AnimatePresence mode="popLayout">
          {msgs.map(msg => {
            const style   = TYPE_STYLE[msg.type] ?? TYPE_STYLE.info;
            const fromMeta = AGENT_META[msg.from];
            const toMeta   = AGENT_META[msg.to];
            const isActive = activeFlow === msg.id;

            return (
              <motion.div
                key={msg.id}
                layout
                initial={msg.animated ? { opacity: 0, y: 8, scale: 0.97 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-2.5 p-2.5 rounded-xl"
                style={{
                  background: isActive ? `${style.border}` : style.bg,
                  border: `1px solid ${isActive ? style.color : style.border}`,
                  boxShadow: isActive ? `0 0 16px ${style.color}30` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <span className="text-sm leading-none flex-shrink-0 mt-0.5">{fromMeta?.icon}</span>

                <div className="flex-1 min-w-0">
                  {/* Route */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold capitalize" style={{ color: fromMeta?.color }}>
                      {msg.from}
                    </span>
                    <ArrowRight size={9} className="text-white/20 flex-shrink-0" />
                    <span className="text-[10px] font-bold capitalize" style={{ color: toMeta?.color }}>
                      {msg.to}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: `${style.color}20`, color: style.color }}>
                      {style.label}
                    </span>
                    <span className="ml-auto text-[9px] text-white/20 font-mono flex-shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {/* Content */}
                  <p className="text-[11px] text-white/65 leading-snug">{msg.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Live activity indicator */}
      <div className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Zap size={11} className="text-cyan-400" />
        <p className="text-[10px] font-mono text-white/30">Real-time agent communications active</p>
        <div className="ml-auto flex gap-1">
          {Object.entries(AGENT_META).slice(0, 4).map(([id, m]) => (
            <div key={id} className="w-1.5 h-1.5 rounded-full" style={{ background: m.color, opacity: 0.6 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
