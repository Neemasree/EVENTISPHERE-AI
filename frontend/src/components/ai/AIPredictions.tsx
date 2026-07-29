import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor, riskBg } from '../../utils/helpers';
import AnimatedCounter from '../common/AnimatedCounter';

export default function AIPredictions() {
  const predictions = useEventStore(s => s.predictions);

  return (
    <div className="space-y-3">
      {predictions.map((pred, i) => {
        const overshoot5  = pred.in5min  > pred.capacity;
        const overshoot10 = pred.in10min > pred.capacity;
        return (
          <motion.div key={pred.zoneId}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all"
            style={{ boxShadow: `0 0 20px ${riskColor(pred.predictedRisk)}10` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-white">{pred.zoneName}</p>
                <p className="text-xs text-white/40">Current: <span className="text-white font-mono">{pred.current}</span> / {pred.capacity}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${riskBg(pred.predictedRisk)}`}>
                  {pred.predictedRisk.toUpperCase()} RISK
                </span>
                <p className="text-xs text-white/40 mt-1">Confidence: <span className="text-cyan-400 font-mono">{pred.confidence}%</span></p>
              </div>
            </div>

            {/* Timeline bars */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '5 min', value: pred.in5min, over: overshoot5 },
                { label: '10 min', value: pred.in10min, over: overshoot10 },
                { label: '30 min', value: pred.in30min, over: pred.in30min > pred.capacity },
              ].map(item => {
                const pct = Math.min(100, Math.round((item.value / pred.capacity) * 100));
                const color = item.over ? '#ef4444' : pct >= 80 ? '#f97316' : pct >= 60 ? '#fbbf24' : '#00ff88';
                return (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-white/40 mb-1">{item.label}</p>
                    <p className={`text-base font-bold font-mono ${item.over ? 'text-red-400' : 'text-white'}`}>
                      <AnimatedCounter value={item.value} />
                    </p>
                    <div className="h-1.5 bg-white/8 rounded-full mt-1.5 overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        style={{ background: color }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                      />
                    </div>
                    {item.over && <p className="text-[9px] text-red-400 mt-1 font-semibold">OVER CAPACITY</p>}
                  </div>
                );
              })}
            </div>

            {/* Confidence bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-white/40 w-20">Confidence</span>
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-cyan-400"
                  initial={{ width: 0 }} animate={{ width: `${pred.confidence}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>
              <span className="text-xs text-cyan-400 font-mono w-8 text-right">{pred.confidence}%</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
