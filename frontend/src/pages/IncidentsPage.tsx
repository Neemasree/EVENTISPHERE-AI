import IncidentHistory from '../components/common/IncidentHistory';
import { useEventStore } from '../store/eventStore';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export default function IncidentsPage() {
  const incidents  = useEventStore(s => s.incidents);
  const resolved   = incidents.filter(i => i.resolved).length;
  const active     = incidents.filter(i => !i.resolved).length;
  const avgResp    = incidents.filter(i => i.resolved && i.responseTime > 0);
  const avgRespVal = avgResp.length
    ? (avgResp.reduce((s, i) => s + i.responseTime, 0) / avgResp.length).toFixed(1)
    : '—';

  const stats = [
    { label: 'Total',    value: incidents.length, icon: <Activity size={16} />,      color: '#00d4ff' },
    { label: 'Resolved', value: resolved,          icon: <CheckCircle size={16} />,   color: '#00f5a0' },
    { label: 'Active',   value: active,            icon: <AlertTriangle size={16} />, color: active > 0 ? '#f43f5e' : 'rgba(255,255,255,0.3)', pulse: active > 0 },
    { label: 'Avg Response', value: `${avgRespVal}m`, icon: null, color: '#a855f7', isString: true },
  ];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-title">Incident History</h1>
        <p className="page-subtitle">Full log of all detected incidents, AI responses, and resolution times</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-4 text-center relative overflow-hidden"
            style={{
              background: `${s.color}08`,
              border: `1px solid ${s.color}20`,
            }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px"
              style={{ background: s.color }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon ?? <Activity size={16} />}</span>
            </div>
            <p className={`text-2xl font-bold font-mono leading-none mb-1 ${(s as any).pulse ? 'animate-pulse' : ''}`}
              style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        <IncidentHistory />
      </motion.div>
    </div>
  );
}
