import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';

const statusColors = {
  active: 'bg-green-400',
  processing: 'bg-cyan-400',
  alert: 'bg-red-400',
  idle: 'bg-white/20',
};

const statusGlow = {
  active: '0 0 8px rgba(74,222,128,0.7)',
  processing: '0 0 8px rgba(0,212,255,0.7)',
  alert: '0 0 8px rgba(239,68,68,0.7)',
  idle: 'none',
};

export default function AgentStatusBar() {
  const agents = useEventStore(s => s.agents);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <span className="text-sm">{agent.icon}</span>
          <div>
            <p className="text-xs font-semibold text-white/80 leading-none">{agent.name.replace(' Agent', '')}</p>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${statusColors[agent.status]} ${agent.status !== 'idle' ? 'animate-pulse' : ''}`}
            style={{ boxShadow: statusGlow[agent.status] }}
          />
        </motion.div>
      ))}
    </div>
  );
}
