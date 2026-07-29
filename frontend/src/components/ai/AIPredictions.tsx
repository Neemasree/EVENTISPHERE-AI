import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor, occupancyColor } from '../../utils/helpers';
import AnimatedCounter from '../common/AnimatedCounter';
import { TrendingUp, Target } from 'lucide-react';

export default function AIPredictions() {
  const predictions = useEventStore(s => s.predictions);

  return (
    <div className="space-y-3">
      {predictions.map((pred, i) => {
        const rc = riskColor(pred.predictedRisk);
        return (
          <motion.div key={pred.zoneId}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl p-4"
            style={{
              background: `${rc}07`,
              border: `1px solid ${rc}22`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}>

            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${rc}60, transparent)` }} />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[13px] font-bold text-white leading-none">{pred.zoneName}</p>
                <p className="text-[10px] text-white/35 mt-1 font-mono">
                  Current: <span className="text-white">{pred.current}</span> / {pred.capacity}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}35` }}>
                  {pred.predictedRisk} risk
                </span>
                <p className="text-[10px] text-white/30 mt-1">
                  <span className="text-cyan-400 font-mono">{pred.confidence}%</span> confidence
                </p>
              </div>
            </div>

            {/* Current bar */}
            <div className="mb-3">
              <div className="progress-track mb-1">
                <motion.div
                  className="progress-fill"
                  style={{ background: occupancyColor(Math.round(pred.current / pred.capacity * 100)) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pred.current / pred.capacity * 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.09 }}
                />
              </div>
            </div>

            {/* Prediction columns */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '+5 min',  value: pred.in5min  },
                { label: '+10 min', value: pred.in10min },
                { label: '+30 min', value: pred.in30min },
              ].map(item => {
                const pct   = Math.min(100, Math.round((item.value / pred.capacity) * 100));
                const over  = item.value > pred.capacity;
                const color = over ? '#f43f5e' : pct >= 80 ? '#fb923c' : pct >= 60 ? '#fbbf24' : '#00f5a0';
                return (
                  <div key={item.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                    <div className="flex items-center justify-center gap-1 mb-1.5">
                      <TrendingUp size={9} style={{ color }} />
                      <p className="text-[9px] text-white/35 uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className={`text-[14px] font-bold font-mono leading-none mb-1.5`}
                      style={{ color: over ? '#f43f5e' : 'white' }}>
                      <AnimatedCounter value={item.value} />
                    </p>
                    <div className="progress-track" style={{ height: '3px' }}>
                      <motion.div className="progress-fill"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.09 }}
                      />
                    </div>
                    {over && (
                      <p className="text-[8px] text-red-400 mt-1 font-bold uppercase tracking-wider">Over cap.</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confidence bar */}
            <div className="flex items-center gap-2 mt-3">
              <Target size={10} className="text-white/30 flex-shrink-0" />
              <div className="flex-1 progress-track">
                <motion.div className="progress-fill"
                  style={{ background: 'linear-gradient(90deg, #00d4ff80, #00d4ff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pred.confidence}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.09 }}
                />
              </div>
              <span className="text-[10px] text-cyan-400 font-mono w-8 text-right">{pred.confidence}%</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
