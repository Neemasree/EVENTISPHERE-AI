import { motion } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';
import AIRecommendations from '../components/ai/AIRecommendations';
import AIPredictions from '../components/ai/AIPredictions';

const statusColors = { active: 'text-green-400', processing: 'text-cyan-400', alert: 'text-red-400', idle: 'text-white/30' };
const statusBg     = { active: 'bg-green-500/15 border-green-500/30', processing: 'bg-cyan-500/15 border-cyan-500/30', alert: 'bg-red-500/15 border-red-500/30', idle: 'bg-white/5 border-white/10' };
const statusDot    = { active: 'bg-green-400', processing: 'bg-cyan-400', alert: 'bg-red-400', idle: 'bg-white/20' };

export default function AgentsPage() {
  const agents = useEventStore(s => s.agents);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-header">AI Agents</h1>
        <p className="page-sub">Multi-agent system status, communications, and live decisions</p>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.map((agent, i) => (
          <motion.div key={agent.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            whileHover={{ y: -2 }}
            className={`rounded-2xl border p-4 transition-all ${statusBg[agent.status]}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{agent.icon}</div>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${statusDot[agent.status]} ${agent.status !== 'idle' ? 'animate-pulse' : ''}`} />
                <span className={`text-xs font-semibold uppercase ${statusColors[agent.status]}`}>{agent.status}</span>
              </div>
            </div>
            <p className="text-sm font-bold text-white mb-1">{agent.name}</p>
            <p className="text-xs text-white/50 leading-snug mb-3">{agent.lastAction}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/30">Messages</span>
              <span className="font-mono text-white/60">{agent.messagesProcessed.toLocaleString()}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comms + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Agent Communications</p>
          <AgentCommsPanel />
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">AI Recommendations</p>
            <AIRecommendations />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Active Predictions</p>
            <AIPredictions />
          </div>
        </div>
      </div>
    </div>
  );
}
