import AlertCenter from '../components/alerts/AlertCenter';
import { useEventStore } from '../store/eventStore';
import { motion } from 'framer-motion';
import { severityBg } from '../utils/helpers';

export default function AlertsPage() {
  const alerts = useEventStore(s => s.alerts);
  const counts = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.dismissed).length,
    high:     alerts.filter(a => a.severity === 'high'     && !a.dismissed).length,
    medium:   alerts.filter(a => a.severity === 'medium'   && !a.dismissed).length,
    low:      alerts.filter(a => a.severity === 'low'      && !a.dismissed).length,
  };

  return (
    <div className="space-y-6 max-w-[900px] mx-auto">
      <div>
        <h1 className="page-header">Alert Center</h1>
        <p className="page-sub">All active alerts — color-coded by severity, auto-updating in real time</p>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-4 gap-3">
        {(['critical','high','medium','low'] as const).map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`rounded-xl border p-3 text-center ${severityBg(s)}`}>
            <p className="text-2xl font-bold mb-0.5">{counts[s]}</p>
            <p className="text-[10px] uppercase tracking-wider opacity-80">{s}</p>
          </motion.div>
        ))}
      </div>

      <AlertCenter />
    </div>
  );
}
