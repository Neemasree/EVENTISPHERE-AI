import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, AlertCircle, Info, CheckCircle, Bell, MapPin, Clock } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { dismissAlert as dismissAlertApi } from '../../services/api';
import { formatTimeAgo } from '../../utils/helpers';
import type { AlertSeverity } from '../../types';

const severityConfig: Record<AlertSeverity, {
  icon: any; color: string; bg: string; border: string; glow: string; label: string;
}> = {
  critical: {
    icon: AlertCircle, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.3)', glow: 'rgba(244,63,94,0.15)', label: 'CRITICAL',
  },
  high: {
    icon: AlertTriangle, color: '#fb923c', bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.25)', glow: 'rgba(251,146,60,0.1)', label: 'HIGH',
  },
  medium: {
    icon: Bell, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.2)', glow: 'rgba(251,191,36,0.08)', label: 'MEDIUM',
  },
  low: {
    icon: Info, color: '#00f5a0', bg: 'rgba(0,245,160,0.06)',
    border: 'rgba(0,245,160,0.18)', glow: 'rgba(0,245,160,0.06)', label: 'LOW',
  },
};

interface Props { compact?: boolean; maxItems?: number }

export default function AlertCenter({ compact, maxItems }: Props) {
  const { alerts, dismissAlert, readAlert } = useEventStore();

  const visible = alerts
    .filter(a => !a.dismissed)
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, maxItems ?? 100);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.15)' }}>
              <CheckCircle size={22} className="text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/60">All clear</p>
              <p className="text-xs text-white/30 mt-0.5">No active alerts</p>
            </div>
          </motion.div>
        )}

        {visible.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const Icon = cfg.icon;

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: -16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => readAlert(alert.id)}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                boxShadow: alert.severity === 'critical'
                  ? `0 0 20px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`
                  : `0 2px 12px ${cfg.glow}`,
                animation: alert.severity === 'critical' && !alert.read
                  ? 'criticalPulse 1.8s ease-in-out infinite'
                  : undefined,
              }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
                style={{ background: cfg.color }} />

              {/* Unread dot */}
              {!alert.read && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-8 w-1.5 h-1.5 rounded-full"
                  style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
                />
              )}

              <div className="flex items-start gap-3 p-3 pl-4">
                {/* Icon */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${cfg.color}18` }}>
                  <Icon size={13} style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className={`text-[12px] font-bold text-white leading-tight flex-1 ${!alert.read ? '' : 'text-white/70'}`}>
                      {alert.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 mt-1 leading-snug line-clamp-2">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {alert.zone && (
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <MapPin size={9} />
                        {alert.zone}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-white/25">
                      <Clock size={9} />
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    dismissAlertApi(alert.id).catch(() => {});
                    dismissAlert(alert.id);
                  }}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-white/70 hover:bg-white/8 transition-all mt-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
