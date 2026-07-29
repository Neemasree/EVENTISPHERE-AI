import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap, Clock, TrendingDown, Award } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatTimeAgo } from '../../utils/helpers';
import { Sounds } from '../../utils/sounds';

interface Props { compact?: boolean }

export default function AIRecommendations({ compact }: Props) {
  const { recommendations, applyRecommendation } = useEventStore();
  const items = compact ? recommendations.slice(0, 2) : recommendations;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {items.map((rec, i) => (
          <motion.div key={rec.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ delay: i * 0.08 }}
            className={`relative overflow-hidden bg-white/5 border rounded-2xl p-4 transition-all duration-300
              ${rec.applied ? 'border-green-500/30 bg-green-500/5' : 'border-white/10 hover:border-cyan-500/30'}`}
            style={!rec.applied ? { boxShadow: '0 0 20px rgba(0,212,255,0.06)' } : {}}
          >
            {/* Applied badge */}
            {rec.applied && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">
                <CheckCircle size={10} className="text-green-400" />
                <span className="text-[10px] text-green-400 font-semibold">APPLIED</span>
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${rec.applied ? 'bg-green-500/20' : 'bg-cyan-500/20'}`}>
                <Zap size={16} className={rec.applied ? 'text-green-400' : 'text-cyan-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-tight">{rec.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{rec.zone} · {formatTimeAgo(rec.timestamp)}</p>
              </div>
            </div>

            <p className="text-xs text-white/60 mb-3 leading-relaxed">{rec.description}</p>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { icon: <TrendingDown size={11} />, label: 'Reduction', value: `${rec.expectedReduction}%`, color: 'text-green-400' },
                { icon: <Clock size={11} />,         label: 'Est. Time',  value: `${rec.estimatedTime} min`, color: 'text-yellow-400' },
                { icon: <Award size={11} />,         label: 'Confidence', value: `${rec.confidence}%`,      color: 'text-cyan-400' },
              ].map(m => (
                <div key={m.label} className="bg-white/5 rounded-lg p-2 text-center">
                  <div className={`flex items-center justify-center gap-0.5 ${m.color} mb-0.5`}>{m.icon}</div>
                  <p className={`text-xs font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[9px] text-white/30">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40 flex-1 mr-3 italic">"{rec.action}"</p>
              {!rec.applied && (
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { applyRecommendation(rec.id); Sounds.success(); }}
                  className="btn-primary flex items-center gap-1.5 flex-shrink-0"
                >
                  <Zap size={12} /> Apply
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
