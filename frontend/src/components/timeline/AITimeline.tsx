import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { formatTime } from '../../utils/helpers';
import type { TimelineEvent } from '../../types';

const typeConfig: Record<TimelineEvent['type'], { color: string; bg: string; border: string; label: string }> = {
  normal:   { color: '#00f5a0', bg: 'rgba(0,245,160,0.06)',  border: 'rgba(0,245,160,0.15)',  label: 'Normal'   },
  warning:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.18)', label: 'Warning'  },
  action:   { color: '#00d4ff', bg: 'rgba(0,212,255,0.07)',  border: 'rgba(0,212,255,0.18)',  label: 'Action'   },
  resolved: { color: '#60a5fa', bg: 'rgba(96,165,250,0.07)', border: 'rgba(96,165,250,0.18)', label: 'Resolved' },
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.22)',  label: 'Critical' },
};

const agentIcons: Record<string, string> = {
  orchestrator: '🧠', crowd: '👥', parking: '🚗',
  gate: '🚪', ticket: '🎫', emergency: '🚨', analytics: '📊',
};

interface Props { compact?: boolean }

export default function AITimeline({ compact }: Props) {
  const timeline = useEventStore(s => s.timeline);
  const items    = compact ? timeline.slice(-6).reverse() : [...timeline].reverse();

  return (
    <div className="relative space-y-0">
      {items.map((evt, i) => {
        const cfg = typeConfig[evt.type];
        return (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-4 group"
          >
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0 w-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 400 }}
                className="w-3 h-3 rounded-full mt-3.5 flex-shrink-0"
                style={{
                  background: cfg.color,
                  boxShadow: `0 0 8px ${cfg.color}80, 0 0 0 2px #020409`,
                }}
              />
              {i < items.length - 1 && (
                <div className="w-px flex-1 min-h-[20px] mt-1 opacity-25"
                  style={{ background: cfg.color }} />
              )}
            </div>

            {/* Card */}
            <div
              className="flex-1 mb-3 p-3.5 rounded-xl transition-all duration-200 group-hover:border-opacity-50"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {evt.agent && (
                      <span className="text-sm leading-none select-none">{agentIcons[evt.agent] ?? '⚙️'}</span>
                    )}
                    <p className="text-[12px] font-bold text-white truncate">{evt.title}</p>
                    <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed">{evt.description}</p>
                </div>
                <p className="text-[10px] font-mono text-white/30 flex-shrink-0 mt-0.5">{formatTime(evt.time)}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
