import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap, Clock, TrendingDown, Award, MapPin, ChevronRight } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatTimeAgo } from '../../utils/helpers';
import { Sounds } from '../../utils/sounds';

interface Props { compact?: boolean }

export default function AIRecommendations({ compact }: Props) {
  const { recommendations, applyRecommendation } = useEventStore();
  const items = compact ? recommendations.slice(0, 2) : recommendations;

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {items.map((rec, i) => (
          <motion.div
            key={rec.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: rec.applied
                ? 'rgba(0,245,160,0.05)'
                : 'rgba(255,255,255,0.04)',
              border: rec.applied
                ? '1px solid rgba(0,245,160,0.2)'
                : '1px solid rgba(255,255,255,0.08)',
              borderTopColor: rec.applied
                ? 'rgba(0,245,160,0.3)'
                : 'rgba(255,255,255,0.12)',
              boxShadow: rec.applied
                ? '0 4px 24px rgba(0,245,160,0.08)'
                : '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Top accent */}
            {!rec.applied && (
              <div className="absolute top-0 left-6 right-6 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }} />
            )}

            {/* Confidence glow (high confidence) */}
            {!rec.applied && rec.confidence >= 95 && (
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, #00d4ff, transparent 70%)' }} />
            )}

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: rec.applied ? 'rgba(0,245,160,0.12)' : 'rgba(0,212,255,0.12)',
                    border: rec.applied ? '1px solid rgba(0,245,160,0.2)' : '1px solid rgba(0,212,255,0.2)',
                  }}
                >
                  {rec.applied
                    ? <CheckCircle size={18} className="text-emerald-400" />
                    : <Zap size={18} style={{ color: '#00d4ff' }} />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-bold text-white leading-tight">{rec.title}</p>
                    {rec.applied && (
                      <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,245,160,0.15)', color: '#00f5a0', border: '1px solid rgba(0,245,160,0.25)' }}>
                        ✓ APPLIED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-white/35">
                      <MapPin size={9} /> {rec.zone}
                    </span>
                    <span className="text-white/20 text-[10px]">·</span>
                    <span className="text-[10px] text-white/30">{formatTimeAgo(rec.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[12px] text-white/55 leading-relaxed mb-3">{rec.description}</p>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { icon: <TrendingDown size={12} />, label: 'Reduction',  value: `${rec.expectedReduction}%`, color: '#00f5a0'  },
                  { icon: <Clock size={12} />,        label: 'Est. Time',  value: `${rec.estimatedTime}m`,     color: '#fbbf24'  },
                  { icon: <Award size={12} />,        label: 'Confidence', value: `${rec.confidence}%`,        color: '#00d4ff'  },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-2.5 text-center"
                    style={{ background: `${m.color}08`, border: `1px solid ${m.color}18` }}>
                    <div className="flex items-center justify-center mb-1" style={{ color: m.color }}>{m.icon}</div>
                    <p className="text-[13px] font-bold font-mono leading-none mb-0.5" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="flex items-center gap-3">
                <p className="flex-1 text-[11px] text-white/35 italic min-w-0 truncate">
                  "{rec.action}"
                </p>
                {!rec.applied && (
                  <motion.button
                    whileHover={{ scale: 1.04, x: 2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { applyRecommendation(rec.id); Sounds.success(); }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #00d4ff, #0088cc)',
                      color: '#020409',
                      boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                    }}
                  >
                    <Zap size={12} />
                    Apply
                    <ChevronRight size={11} />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
