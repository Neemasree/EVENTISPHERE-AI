import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { formatTime } from '../../utils/helpers';
import type { TimelineEvent } from '../../types';

const typeStyles: Record<TimelineEvent['type'], { dot: string; line: string; bg: string; text: string }> = {
  normal:   { dot: 'bg-green-400',  line: 'border-green-400/30',  bg: 'bg-green-500/8',   text: 'text-green-400' },
  warning:  { dot: 'bg-yellow-400', line: 'border-yellow-400/30', bg: 'bg-yellow-500/8',  text: 'text-yellow-400' },
  action:   { dot: 'bg-cyan-400',   line: 'border-cyan-400/30',   bg: 'bg-cyan-500/8',    text: 'text-cyan-400' },
  resolved: { dot: 'bg-blue-400',   line: 'border-blue-400/30',   bg: 'bg-blue-500/8',    text: 'text-blue-400' },
  critical: { dot: 'bg-red-400',    line: 'border-red-400/30',    bg: 'bg-red-500/8',     text: 'text-red-400' },
};

const agentIcons: Record<string, string> = {
  orchestrator: '🧠', crowd: '👥', parking: '🚗',
  gate: '🚪', ticket: '🎫', emergency: '🚨', analytics: '📊',
};

interface Props { compact?: boolean }

export default function AITimeline({ compact }: Props) {
  const timeline = useEventStore(s => s.timeline);
  const items = compact ? timeline.slice(-6).reverse() : [...timeline].reverse();

  return (
    <div className="relative">
      <div className="space-y-0">
        {items.map((evt, i) => {
          const style = typeStyles[evt.type];
          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-4 group"
            >
              {/* Timeline spine */}
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.06 + 0.1 }}
                  className={`w-3 h-3 rounded-full ${style.dot} flex-shrink-0 mt-3 ring-2 ring-dark-900`}
                  style={{ boxShadow: `0 0 8px ${style.dot.replace('bg-', '').replace('-400', '')}` }}
                />
                {i < items.length - 1 && (
                  <div className={`w-px flex-1 min-h-[24px] border-l-2 border-dashed ${style.line} mt-1`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 mb-4 p-3 rounded-xl border ${style.bg} border-white/8 group-hover:border-white/15 transition-colors`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {evt.agent && <span className="text-sm">{agentIcons[evt.agent] ?? '⚙️'}</span>}
                      <p className="text-sm font-semibold text-white truncate">{evt.title}</p>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed">{evt.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-mono text-white/40">{formatTime(evt.time)}</p>
                    <span className={`text-[9px] font-semibold uppercase ${style.text}`}>{evt.type}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
