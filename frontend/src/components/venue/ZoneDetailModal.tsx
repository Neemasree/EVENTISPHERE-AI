import { motion } from 'framer-motion';
import { X, Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Zone } from '../../types';
import { riskColor, riskBg, occupancyColor } from '../../utils/helpers';

interface Props { zone: Zone; onClose: () => void; }

export default function ZoneDetailModal({ zone, onClose }: Props) {
  const pct = zone.occupancy;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-dark-800 border border-white/15 rounded-2xl overflow-hidden"
        style={{ boxShadow: `0 0 60px ${riskColor(zone.riskLevel)}30` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8"
          style={{ background: `${riskColor(zone.riskLevel)}12` }}>
          <div>
            <p className="text-lg font-bold text-white">{zone.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${riskBg(zone.riskLevel)}`}>
              {zone.riskLevel.toUpperCase()} RISK
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Donut gauge */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <motion.circle cx="50" cy="50" r="40" fill="none"
                  stroke={occupancyColor(pct)} strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{pct}%</span>
                <span className="text-[9px] text-white/40">full</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {[
                { icon: <Users size={13} />, label: 'Current', value: `${zone.currentCrowd.toLocaleString()}` },
                { icon: <TrendingUp size={13} />, label: 'Capacity', value: `${zone.maxCapacity.toLocaleString()}` },
                { icon: <Clock size={13} />, label: 'Wait', value: `${zone.waitingTime} min` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-white/40">{row.icon}{row.label}</span>
                  <span className="text-xs font-bold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          {zone.recommendation && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
              <p className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5 mb-1">
                <AlertTriangle size={12} /> AI Recommendation
              </p>
              <p className="text-xs text-white/70">{zone.recommendation}</p>
            </div>
          )}

          {/* Status bar */}
          <div>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Occupancy</span><span>{pct}%</span>
            </div>
            <div className="h-2 bg-white/8 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: occupancyColor(pct) }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
