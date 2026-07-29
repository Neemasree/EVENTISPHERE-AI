import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trophy, X, TrendingUp, Clock, Users, Zap, CheckCircle } from 'lucide-react';
import AnimatedCounter from '../common/AnimatedCounter';

interface Props { onClose: () => void }

const STATS = [
  { label: 'Total Visitors',        value: 19842, suffix: '',  color: '#00d4ff', icon: <Users size={18} />,     delay: 0.1  },
  { label: 'Parking Efficiency',    value: 96,    suffix: '%', color: '#00f5a0', icon: <TrendingUp size={18} />, delay: 0.2  },
  { label: 'Emergency Response',    value: 2,     suffix: 'm', color: '#a855f7', icon: <Clock size={18} />,     delay: 0.3  },
  { label: 'Avg Wait Time',         value: 3.2,   suffix: 'm', color: '#fbbf24', icon: <Clock size={18} />,     delay: 0.4  },
  { label: 'AI Recommendations',    value: 14,    suffix: '',  color: '#00d4ff', icon: <Zap size={18} />,       delay: 0.5  },
  { label: 'Accepted',              value: 13,    suffix: '',  color: '#00f5a0', icon: <CheckCircle size={18} />,delay: 0.6 },
  { label: 'Fraud Tickets Blocked', value: 6,     suffix: '',  color: '#f43f5e', icon: <Shield size={18} />,    delay: 0.7  },
  { label: 'Visitor Satisfaction',  value: 96,    suffix: '%', color: '#00f5a0', icon: <Trophy size={18} />,    delay: 0.8  },
];

const ACHIEVEMENTS = [
  { label: 'AI prevented 4 congestion events', icon: '🛡️' },
  { label: 'Zero capacity breaches',            icon: '✅' },
  { label: '13/14 recommendations accepted',    icon: '🎯' },
  { label: '2 min avg emergency response',      icon: '⚡' },
];

export default function FinalSummaryScreen({ onClose }: Props) {
  const [phase, setPhase] = useState<'stats' | 'achievements' | 'closing'>('stats');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(2,4,9,0.97)', backdropFilter: 'blur(20px)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div className="absolute w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">

        {/* Close */}
        <button onClick={onClose}
          className="absolute -top-2 -right-2 w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <X size={15} />
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex mb-6">
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                boxShadow: '0 0 60px rgba(0,212,255,0.5)',
              }}
              animate={{ boxShadow: [
                '0 0 40px rgba(0,212,255,0.4)',
                '0 0 80px rgba(0,212,255,0.7)',
                '0 0 40px rgba(0,212,255,0.4)',
              ]}}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Trophy size={36} className="text-white" />
            </motion.div>
            {[1,2].map(i => (
              <motion.div key={i} className="absolute inset-0 rounded-3xl"
                style={{ border: '1px solid rgba(0,212,255,0.4)' }}
                animate={{ scale: [1, 1.6 + i * 0.5], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} />
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2 font-display tracking-tight"
          >
            Event Completed{' '}
            <span style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Successfully
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-white/40 text-sm"
          >
            Coldplay — Music of the Spheres · Arena Central
          </motion.p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{
                background: `${s.color}08`,
                border: `1px solid ${s.color}22`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px" style={{ background: s.color }} />
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <p className="text-xl font-bold font-mono leading-none mb-1" style={{ color: s.color }}>
                <AnimatedCounter value={typeof s.value === 'number' ? s.value : parseFloat(s.value as any)} suffix={s.suffix} />
              </p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.15)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3">AI Impact Summary</p>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div key={a.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + i * 0.1 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-lg leading-none select-none">{a.icon}</span>
                <span className="text-[11px] text-white/70 leading-tight">{a.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-center"
        >
          <p className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Powered by</p>
          <p className="text-2xl font-bold font-display"
            style={{
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            EventiSphere AI
          </p>
          <p className="text-[10px] font-mono text-white/20 mt-1 tracking-widest">
            INTELLIGENT EVENT OPERATIONS PLATFORM
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
