import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { AgentType } from '../../types';
import { formatTime } from '../../utils/helpers';
import { ArrowRight, Radio } from 'lucide-react';

const agentColors: Record<AgentType, string> = {
  orchestrator: '#00d4ff',
  crowd:        '#a855f7',
  parking:      '#fbbf24',
  gate:         '#00f5a0',
  ticket:       '#60a5fa',
  emergency:    '#f43f5e',
  analytics:    '#fb923c',
};

const agentIcons: Record<AgentType, string> = {
  orchestrator: '🧠', crowd: '👥', parking: '🚗',
  gate: '🚪', ticket: '🎫', emergency: '🚨', analytics: '📊',
};

const msgTypeConfig: Record<string, { bg: string; border: string; dot: string }> = {
  info:     { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', dot: 'rgba(255,255,255,0.3)' },
  warning:  { bg: 'rgba(251,191,36,0.06)',  border: 'rgba(251,191,36,0.2)',  dot: '#fbbf24' },
  action:   { bg: 'rgba(0,212,255,0.06)',   border: 'rgba(0,212,255,0.18)', dot: '#00d4ff' },
  response: { bg: 'rgba(0,245,160,0.06)',   border: 'rgba(0,245,160,0.18)', dot: '#00f5a0' },
};

let _seeded = false;

interface Props { compact?: boolean }

export default function AgentCommsPanel({ compact }: Props) {
  const { agentMessages, addAgentMessage } = useEventStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (_seeded) return;
    _seeded = true;
    const now = Date.now();
    const INITIAL = [
      { from: 'crowd',        to: 'orchestrator', message: 'Gate A at 76%. Queue building — requesting gate redistribution.', type: 'warning',  ts: -15 },
      { from: 'orchestrator', to: 'gate',         message: 'Acknowledged. Open Gate C to absorb Gate A load.',               type: 'action',   ts: -14 },
      { from: 'gate',         to: 'orchestrator', message: 'Gate C opened. Signage updated. Monitoring redistribution.',      type: 'response', ts: -13 },
      { from: 'crowd',        to: 'orchestrator', message: 'Food Court at 87%. Overflow predicted in 4 minutes.',             type: 'warning',  ts: -8  },
      { from: 'orchestrator', to: 'crowd',        message: 'Recommendation queued: Open Food Stall 3. Awaiting approval.',    type: 'action',   ts: -7  },
      { from: 'parking',      to: 'orchestrator', message: 'Parking A at 84%. Rerouting arrivals to Lot B.',                  type: 'info',     ts: -5  },
      { from: 'orchestrator', to: 'analytics',    message: 'Log all events for post-event analysis report.',                  type: 'action',   ts: -2  },
    ];
    INITIAL.forEach((m, i) => {
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

  const msgs = compact ? agentMessages.slice(-5) : agentMessages;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Radio size={13} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Agent Comms</p>
            <p className="text-[9px] text-white/30 mt-0.5 font-mono">Live feed</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>
        <span className="text-[10px] font-mono text-white/30 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          {agentMessages.length} msgs
        </span>
      </div>

      {/* Feed */}
      <div className={`overflow-y-auto p-3 space-y-1.5 ${compact ? 'max-h-60' : 'max-h-[480px]'}`}>
        <AnimatePresence mode="popLayout">
          {msgs.map(msg => {
            const cfg = msgTypeConfig[msg.type] ?? msgTypeConfig.info;
            const fromColor = agentColors[msg.from];
            const toColor   = agentColors[msg.to];

            return (
              <motion.div
                key={msg.id}
                layout
                initial={msg.animated ? { opacity: 0, y: 6, scale: 0.98 } : { opacity: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-2.5 p-2.5 rounded-xl"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                {/* From icon */}
                <span className="text-sm leading-none flex-shrink-0 mt-0.5 select-none">
                  {agentIcons[msg.from]}
                </span>

                <div className="flex-1 min-w-0">
                  {/* Agents row */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold capitalize" style={{ color: fromColor }}>
                      {msg.from}
                    </span>
                    <ArrowRight size={9} className="text-white/20 flex-shrink-0" />
                    <span className="text-[10px] font-bold capitalize" style={{ color: toColor }}>
                      {msg.to}
                    </span>

                    {/* Type badge */}
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ml-0.5 flex-shrink-0"
                      style={{ background: `${cfg.dot}20`, color: cfg.dot }}>
                      {msg.type}
                    </span>

                    <span className="ml-auto text-[9px] text-white/20 font-mono flex-shrink-0">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-[11px] text-white/65 leading-snug">{msg.message}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
