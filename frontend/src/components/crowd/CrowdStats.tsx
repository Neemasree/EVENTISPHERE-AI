import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import AnimatedCounter from '../common/AnimatedCounter';
import { Users, Building2, Clock, TrendingUp } from 'lucide-react';

export default function CrowdStats() {
  const { kpi } = useEventStore();

  const summaryCards = [
    { label: 'Current Visitors', value: kpi.currentCrowd,      suffix: '',     icon: <Users size={15} />,      color: '#00d4ff' },
    { label: 'Max Capacity',     value: kpi.totalCapacity,     suffix: '',     icon: <Building2 size={15} />,  color: '#a855f7' },
    { label: 'Occupancy',        value: kpi.occupancyPercent,  suffix: '%',    icon: <TrendingUp size={15} />, color: kpi.occupancyPercent >= 80 ? '#fb923c' : '#00f5a0' },
    { label: 'Avg Wait',         value: kpi.avgWaitTime,       suffix: ' min', icon: <Clock size={15} />,      color: kpi.avgWaitTime > 8 ? '#fb923c' : '#00f5a0' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {summaryCards.map((s, i) => (
        <motion.div key={s.label}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-4 text-center relative overflow-hidden"
          style={{
            background: `${s.color}08`,
            border: `1px solid ${s.color}20`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px" style={{ background: s.color }} />
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
            <span style={{ color: s.color }}>{s.icon}</span>
          </div>
          <p className="text-[9px] text-white/35 uppercase tracking-widest mb-1.5 font-bold">{s.label}</p>
          <p className="text-xl font-bold font-mono leading-none" style={{ color: s.color }}>
            <AnimatedCounter value={s.value} suffix={s.suffix} />
          </p>
        </motion.div>
      ))}
    </div>
  );
}
