import AlertCenter from '../components/alerts/AlertCenter';
import { useEventStore } from '../store/eventStore';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { dismissAlert as dismissAlertApi } from '../services/api';

const severityMeta = {
  critical: { icon: AlertCircle,  color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.25)'  },
  high:     { icon: AlertTriangle,color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)'  },
  medium:   { icon: Bell,         color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.18)' },
  low:      { icon: Info,         color: '#00f5a0', bg: 'rgba(0,245,160,0.06)',  border: 'rgba(0,245,160,0.15)'  },
} as const;

export default function AlertsPage() {
  const alerts = useEventStore(s => s.alerts);
  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.dismissed).length,
    high:     alerts.filter(a => a.severity === 'high'     && !a.dismissed).length,
    medium:   alerts.filter(a => a.severity === 'medium'   && !a.dismissed).length,
    low:      alerts.filter(a => a.severity === 'low'      && !a.dismissed).length,
  };
  const total = Object.values(counts).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Alert Center</h1>
          <p className="page-subtitle">All active alerts, color-coded by severity and auto-updated in real time</p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold"
            style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#f43f5e' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {total} active
          </div>
        )}
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(severityMeta) as [keyof typeof severityMeta, typeof severityMeta[keyof typeof severityMeta]][]).map(([s, meta], i) => {
          const Icon = meta.icon;
          return (
            <motion.div key={s}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-12"
                style={{ background: meta.color }} />
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${meta.color}15` }}>
                <Icon size={15} style={{ color: meta.color }} />
              </div>
              <p className="text-2xl font-bold font-mono leading-none mb-1" style={{ color: meta.color }}>
                {counts[s]}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{s}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        <AlertCenter />
      </motion.div>
    </div>
  );
}
