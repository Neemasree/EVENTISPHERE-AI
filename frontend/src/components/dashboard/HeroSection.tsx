import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor } from '../../utils/helpers';
import { Cpu, Zap, TrendingUp, Users } from 'lucide-react';

export default function HeroSection() {
  const { kpi, agents } = useEventStore();
  const activeAgents = agents.filter(a => a.status !== 'idle').length;
  const riskC = riskColor(kpi.riskLevel);

  const stats = [
    {
      icon: <Cpu size={14} />,
      label: 'AI Status',
      value: 'ACTIVE',
      color: '#00d4ff',
      bg: 'rgba(0,212,255,0.08)',
      border: 'rgba(0,212,255,0.2)',
    },
    {
      icon: <Zap size={14} />,
      label: 'Agents Online',
      value: `${activeAgents}/${agents.length}`,
      color: '#a855f7',
      bg: 'rgba(168,85,247,0.08)',
      border: 'rgba(168,85,247,0.2)',
    },
    {
      icon: <Users size={14} />,
      label: 'Peak Zone',
      value: kpi.peakZone,
      color: '#fb923c',
      bg: 'rgba(251,146,60,0.08)',
      border: 'rgba(251,146,60,0.2)',
    },
    {
      icon: <TrendingUp size={14} />,
      label: 'Flow Rate',
      value: `${kpi.flowRate}/min`,
      color: '#00f5a0',
      bg: 'rgba(0,245,160,0.08)',
      border: 'rgba(0,245,160,0.2)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl mb-6"
      style={{
        background: 'linear-gradient(135deg, rgba(10,22,40,0.95) 0%, rgba(15,31,58,0.9) 50%, rgba(10,22,40,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {/* Animated scan lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-full h-px"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(0,212,255,${0.06 + i * 0.02}), transparent)`,
              top: `${20 + i * 22}%`,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 10 + i * 3, repeat: Infinity, ease: 'linear', delay: i * 2 }}
          />
        ))}
        {/* Corner glow */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, #a855f7, transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle at bottom left, #00d4ff, transparent 65%)' }} />
      </div>

      <div className="relative z-10 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

          {/* ── Left: Event identity ── */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              {/* Live badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)' }}>
                <span className="live-dot w-1.5 h-1.5" />
                <span className="text-[10px] font-bold text-emerald-400 tracking-widest">LIVE EVENT</span>
              </div>

              {/* Risk badge */}
              <motion.div
                animate={kpi.riskLevel === 'critical' ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                style={{
                  background: `${riskC}15`,
                  border: `1px solid ${riskC}40`,
                  boxShadow: kpi.riskLevel === 'critical' ? `0 0 12px ${riskC}40` : 'none',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full"
                  style={{ background: riskC, boxShadow: `0 0 6px ${riskC}` }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: riskC }}>
                  {kpi.riskLevel} Risk
                </span>
              </motion.div>
            </div>

            <h1 className="text-2xl lg:text-[28px] font-bold text-white leading-tight tracking-tight mb-1.5 font-display">
              Coldplay —{' '}
              <span className="text-gradient">Music of the Spheres</span>
            </h1>
            <p className="text-sm text-white/40">
              Arena Central &nbsp;·&nbsp; Organized by LiveNation &nbsp;·&nbsp; AI-Assisted Operations
            </p>
          </div>

          {/* ── Right: Quick stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:flex lg:gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl whitespace-nowrap"
                style={{ background: s.bg, border: `1px solid ${s.border}` }}
              >
                <div className="flex items-center gap-1.5" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-[9px] font-bold tracking-widest uppercase text-white/35">{s.label}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
