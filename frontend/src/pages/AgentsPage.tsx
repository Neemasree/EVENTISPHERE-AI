import { motion } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import AgentFlowPanel from '../components/agents/AgentFlowPanel';
import type { AgentStatus } from '../types';

const statusCfg: Record<AgentStatus, { color: string; bg: string; border: string; pulse: boolean }> = {
  active:     { color: '#00f5a0', bg: 'rgba(0,245,160,0.07)',  border: 'rgba(0,245,160,0.2)',  pulse: false },
  processing: { color: '#00d4ff', bg: 'rgba(0,212,255,0.07)',  border: 'rgba(0,212,255,0.2)',  pulse: true  },
  alert:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.09)',  border: 'rgba(244,63,94,0.28)', pulse: true  },
  idle:       { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', pulse: false },
};

export default function AgentsPage() {
  const agents = useEventStore(s => s.agents);

  const statusCounts = agents.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">AI Agent Network</h1>
          <p className="page-subtitle">Multi-agent system status and live inter-agent communications</p>
        </div>
        {/* Status summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.entries(statusCounts) as [AgentStatus, number][]).map(([status, count]) => {
            const cfg = statusCfg[status];
            return (
              <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
                <span className="text-[11px] font-bold capitalize" style={{ color: cfg.color }}>{status}</span>
                <span className="text-[11px] font-mono text-white/40">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {agents.map((agent, i) => {
          const cfg = statusCfg[agent.status];
          return (
            <motion.div key={agent.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>

              {/* Top accent line */}
              <div className="absolute top-0 left-4 right-4 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />

              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl leading-none select-none">{agent.icon}</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full"
                      style={{
                        background: cfg.color,
                        boxShadow: `0 0 6px ${cfg.color}`,
                        animation: cfg.pulse ? 'pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                      }} />
                    {cfg.pulse && (
                      <motion.div className="absolute inset-0 rounded-full"
                        style={{ border: `1px solid ${cfg.color}` }}
                        animate={{ scale: [0.8, 2], opacity: [0.7, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity }} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                    {agent.status}
                  </span>
                </div>
              </div>

              <p className="text-[13px] font-bold text-white mb-1.5 leading-tight">{agent.name}</p>
              <p className="text-[11px] text-white/45 leading-snug mb-4 line-clamp-2">{agent.lastAction}</p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: `1px solid ${cfg.border}` }}>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Messages</span>
                <span className="text-[12px] font-mono font-bold" style={{ color: cfg.color }}>
                  {agent.messagesProcessed.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Communications feed — full width */}
      <AgentFlowPanel />
    </div>
  );
}
