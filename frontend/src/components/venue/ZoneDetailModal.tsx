import { motion } from 'framer-motion';
import { X, Users, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import type { Zone } from '../../types';
import { riskColor, occupancyColor } from '../../utils/helpers';

interface Props { zone: Zone; onClose: () => void; }

export default function ZoneDetailModal({ zone, onClose }: Props) {
  const pct          = zone.occupancy;
  const circumference = 2 * Math.PI * 38;
  const offset       = circumference * (1 - pct / 100);
  const rc           = riskColor(zone.riskLevel);
  const oc           = occupancyColor(pct);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1,    y: 0,  opacity: 1 }}
        exit={{   scale: 0.88, y: 16, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(8,16,32,0.98)',
          border: `1px solid ${rc}30`,
          borderTopColor: `${rc}50`,
          boxShadow: `0 0 60px ${rc}20, 0 30px 80px rgba(0,0,0,0.7)`,
          backdropFilter: 'blur(40px)',
        }}
      >
        {/* Top accent */}
        <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${rc}, transparent)` }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${rc}18`, background: `${rc}08` }}>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{zone.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${rc}18`, color: rc, border: `1px solid ${rc}35` }}>
                {zone.riskLevel} risk
              </span>
              <span className="text-[10px] text-white/35 capitalize">{zone.type} zone</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Gauge + Stats */}
          <div className="flex items-center gap-5">
            {/* Donut */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none"
                  stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                <motion.circle cx="50" cy="50" r="38" fill="none"
                  stroke={oc} strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ filter: `drop-shadow(0 0 6px ${oc}80)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold font-mono leading-none" style={{ color: oc }}>{pct}</span>
                <span className="text-[9px] text-white/35 font-bold uppercase tracking-wider mt-0.5">%</span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-2.5 flex-1">
              {[
                { icon: <Users size={12} />,      label: 'Current',  value: zone.currentCrowd.toLocaleString(),  color: '#00d4ff' },
                { icon: <TrendingUp size={12} />, label: 'Capacity', value: zone.maxCapacity.toLocaleString(),   color: '#a855f7' },
                { icon: <Clock size={12} />,      label: 'Wait Time',value: `${zone.waitingTime} min`,           color: '#fbbf24' },
                { icon: <Activity size={12} />,   label: 'Status',   value: zone.riskLevel.toUpperCase(),        color: rc        },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] text-white/40">
                    <span style={{ color: row.color }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-white/35 uppercase tracking-wider font-bold">Occupancy</span>
              <span className="font-mono font-bold" style={{ color: oc }}>{pct}%</span>
            </div>
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                style={{ background: `linear-gradient(90deg, ${oc}80, ${oc})` }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-white/20 font-mono">
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          {/* Recommendation */}
          {zone.recommendation && (
            <div className="p-3.5 rounded-xl"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.18)' }}>
              <p className="text-[10px] font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider">
                <AlertTriangle size={11} /> AI Recommendation
              </p>
              <p className="text-[12px] text-white/65 leading-relaxed">{zone.recommendation}</p>
            </div>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
