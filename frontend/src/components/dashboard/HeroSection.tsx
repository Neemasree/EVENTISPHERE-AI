import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskBg } from '../../utils/helpers';

export default function HeroSection() {
  const { kpi, agents } = useEventStore();
  const orchestrator = agents.find(a => a.id === 'orchestrator');
  const activeAgents = agents.filter(a => a.status !== 'idle').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-dark-800 via-slate-900 to-dark-800 p-6 mb-6"
      style={{ boxShadow: '0 0 60px rgba(0,212,255,0.08)' }}
    >
      {/* Animated background lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent w-full"
            style={{ top: `${15 + i * 18}%` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'linear', delay: i * 1.5 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/15 border border-green-500/30 rounded-full">
              <span className="live-dot" />
              <span className="text-xs font-bold text-green-400 tracking-wider">LIVE EVENT</span>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${riskBg(kpi.riskLevel)}`}>
              {kpi.riskLevel.toUpperCase()} RISK
            </div>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
            Coldplay — <span className="text-gradient">Music of the Spheres</span>
          </h1>
          <p className="text-sm text-white/50">Arena Central · Organized by LiveNation · AI-Assisted Operations</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
          {[
            { label: 'AI Status', value: orchestrator?.status.toUpperCase() ?? 'ACTIVE', color: 'text-cyan-400' },
            { label: 'Active Agents', value: `${activeAgents}/${agents.length}`, color: 'text-purple-400' },
            { label: 'Peak Zone', value: kpi.peakZone, color: 'text-orange-400' },
            { label: 'Flow Rate', value: `${kpi.flowRate}/min`, color: 'text-green-400' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.color} font-mono truncate`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
