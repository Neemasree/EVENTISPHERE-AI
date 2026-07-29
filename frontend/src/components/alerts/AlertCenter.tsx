import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, Bell } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { severityBg, formatTimeAgo, speakAlert } from '../../utils/helpers';
import type { AlertSeverity } from '../../types';

const icons: Record<AlertSeverity, any> = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: Bell,
  low: Info,
};

interface Props { compact?: boolean; maxItems?: number }

export default function AlertCenter({ compact, maxItems }: Props) {
  const { alerts, dismissAlert, readAlert, isMuted } = useEventStore();
  const visible = alerts
    .filter(a => !a.dismissed)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, maxItems ?? 100);

  const handleRead = (id: string) => readAlert(id);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2 py-8 text-white/30">
            <CheckCircle size={28} />
            <p className="text-sm">No active alerts</p>
          </motion.div>
        )}
        {visible.map((alert, i) => {
          const Icon = icons[alert.severity];
          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: -16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 16, height: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => handleRead(alert.id)}
              className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${severityBg(alert.severity)}
                ${!alert.read ? 'ring-1 ring-white/10' : 'opacity-75'}`}
            >
              {/* Unread dot */}
              {!alert.read && (
                <span className="absolute top-2 right-8 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}

              <div className="flex-shrink-0 mt-0.5">
                <Icon size={14} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-semibold text-white truncate">{alert.title}</p>
                  <span className="text-[9px] text-white/40 flex-shrink-0">{formatTimeAgo(alert.timestamp)}</span>
                </div>
                <p className="text-[11px] text-white/60 leading-snug">{alert.message}</p>
                {alert.zone && (
                  <p className="text-[10px] text-white/30 mt-1">📍 {alert.zone}</p>
                )}
              </div>

              <button
                onClick={e => { e.stopPropagation(); dismissAlert(alert.id); }}
                className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-white/30 hover:text-white/80 transition-colors mt-0.5"
              >
                <X size={11} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
