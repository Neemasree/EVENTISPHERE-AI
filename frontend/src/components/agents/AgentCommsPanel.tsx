import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { AgentType } from '../../types';
import { formatTime } from '../../utils/helpers';

const agentColors: Record<AgentType, string> = {
  orchestrator: '#00d4ff',
  crowd:        '#a855f7',
  parking:      '#fbbf24',
  gate:         '#00ff88',
  ticket:       '#60a5fa',
  emergency:    '#ef4444',
  analytics:    '#f97316',
};

const agentIcons: Record<AgentType, string> = {
  orchestrator: '🧠', crowd: '👥', parking: '🚗',
  gate: '🚪', ticket: '🎫', emergency: '🚨', analytics: '📊',
};

const msgTypeBg: Record<string, string> = {
  info:     'bg-white/5 border-white/10',
  warning:  'bg-yellow-500/10 border-yellow-500/20',
  action:   'bg-cyan-500/10 border-cyan-500/20',
  response: 'bg-green-500/10 border-green-500/20',
};

interface Props { compact?: boolean }

// Track whether the store has already been seeded this session
// (module-level flag — survives remounts, resets on page reload)
let _seeded = false;

export default function AgentCommsPanel({ compact }: Props) {
  const { agentMessages, addAgentMessage } = useEventStore();
  const endRef = useRef<HTMLDivElement>(null);

  // Seed initial messages once per session, not per mount
  useEffect(() => {
    if (_seeded) return;
    _seeded = true;

    const now = Date.now();
    const INITIAL_MSGS = [
      { from: 'crowd',        to: 'orchestrator', message: 'Gate A at 76%. Queue building — requesting gate redistribution.', type: 'warning',  ts: -15 },
      { from: 'orchestrator', to: 'gate',         message: 'Acknowledged. Open Gate C immediately to absorb Gate A load.',   type: 'action',   ts: -14 },
      { from: 'gate',         to: 'orchestrator', message: 'Gate C opened. Signage updated. Monitoring crowd redistribution.', type: 'response', ts: -13 },
      { from: 'crowd',        to: 'orchestrator', message: 'Food Court at 87%. Overflow predicted in 4 minutes.',             type: 'warning',  ts: -8  },
      { from: 'orchestrator', to: 'crowd',        message: 'Recommendation generated: Open Food Stall 3. Awaiting approval.', type: 'action',   ts: -7  },
      { from: 'parking',      to: 'orchestrator', message: 'Parking A at 84%. Rerouting new arrivals to Lot B.',              type: 'info',     ts: -5  },
      { from: 'orchestrator', to: 'analytics',    message: 'Log all events for post-event analysis report.',                  type: 'action',   ts: -2  },
    ];

    INITIAL_MSGS.forEach((m, i) => {
      setTimeout(() => {
        addAgentMessage({
          // Use timestamp + index for a guaranteed-unique key
          id: `seed_${now}_${i}`,
          from: m.from as AgentType,
          to:   m.to   as AgentType,
          message:   m.message,
          type:      m.type as any,
          timestamp: new Date(now + m.ts * 60000),
          animated:  false,
        });
      }, i * 80);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

  const msgs = compact ? agentMessages.slice(-5) : agentMessages;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Agent Communications</span>
          <span className="live-dot" />
        </div>
        <span className="text-xs text-white/40 font-mono">{agentMessages.length} messages</span>
      </div>

      <div className={`overflow-y-auto p-3 space-y-2 ${compact ? 'max-h-56' : 'max-h-[480px]'}`}>
        <AnimatePresence mode="popLayout">
          {msgs.map(msg => (
            <motion.div
              key={msg.id}
              layout
              initial={msg.animated ? { opacity: 0, x: -10 } : { opacity: 1 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 p-2.5 rounded-xl border ${msgTypeBg[msg.type]}`}
            >
              <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                <span className="text-sm">{agentIcons[msg.from]}</span>
                <div className="w-1 h-1 rounded-full" style={{ background: agentColors[msg.from] }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] font-bold" style={{ color: agentColors[msg.from] }}>
                    {msg.from.charAt(0).toUpperCase() + msg.from.slice(1)}
                  </span>
                  <span className="text-[10px] text-white/30">→</span>
                  <span className="text-[10px] font-bold" style={{ color: agentColors[msg.to] }}>
                    {msg.to.charAt(0).toUpperCase() + msg.to.slice(1)}
                  </span>
                  <span className="ml-auto text-[9px] text-white/25 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-[11px] text-white/70 leading-snug">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}
