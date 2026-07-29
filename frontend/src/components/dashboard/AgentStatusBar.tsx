import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { AgentStatus } from '../../types';

const statusConfig: Record<AgentStatus, { color: string; bg: string; border: string; label: string; pulse: boolean }> = {
  active:     { color: '#00f5a0', bg: 'rgba(0,245,160,0.08)',  border: 'rgba(0,245,160,0.2)',   label: 'Active',     pulse: false },
  processing: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)',  border: 'rgba(0,212,255,0.2)',   label: 'Processing', pulse: true  },
  alert:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   label: 'Alert',      pulse: true  },
  idle:       { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', label: 'Idle', pulse: false },
};

export default function AgentStatusBar() {
  const agents = useEventStore(s => s.agents);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {agents.map((agent, i) => {
        const cfg = statusConfig[agent.status];
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -2, scale: 1.03 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl cursor-default"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Agent emoji */}
            <span className="text-sm leading-none select-none">{agent.icon}</span>

            {/* Name */}
            <div>
              <p className="text-[12px] font-semibold text-white/80 leading-none mb-0.5">
                {agent.name.replace(' Agent', '')}
              </p>
              <p className="text-[9px] text-white/30 leading-none font-mono">
                {agent.messagesProcessed.toLocaleString()} msgs
              </p>
            </div>

            {/* Status dot */}
            <div className="relative flex items-center justify-center ml-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: cfg.color,
                  boxShadow: `0 0 6px ${cfg.color}`,
                  animation: cfg.pulse ? 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                }}
              />
              {cfg.pulse && (
                <motion.div
                  className="absolute w-4 h-4 rounded-full"
                  style={{ border: `1px solid ${cfg.color}` }}
                  animate={{ scale: [0.6, 1.6], opacity: [0.7, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
