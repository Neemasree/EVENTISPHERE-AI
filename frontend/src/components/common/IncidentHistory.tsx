import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor, formatTime } from '../../utils/helpers';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function IncidentHistory() {
  const incidents = useEventStore(s => s.incidents);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>

      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <AlertTriangle size={13} className="text-orange-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Incident Log</p>
            <p className="text-[9px] text-white/30 mt-0.5">{incidents.length} total incidents recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg text-emerald-400 font-mono"
            style={{ background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.15)' }}>
            {incidents.filter(i => i.resolved).length} resolved
          </span>
          {incidents.filter(i => !i.resolved).length > 0 && (
            <span className="text-[10px] px-2 py-1 rounded-lg text-red-400 font-mono animate-pulse"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              {incidents.filter(i => !i.resolved).length} active
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Severity', 'Zone', 'Time', 'Description', 'Action Taken', 'Response', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-white/25">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc, i) => {
              const rc = riskColor(inc.severity);
              return (
                <motion.tr key={inc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="transition-colors hover:bg-white/3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}30` }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold text-white/80">{inc.zone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono text-white/40">{formatTime(inc.time)}</span>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-[11px] text-white/60 truncate">{inc.description}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-[11px] text-white/50 truncate">{inc.actionTaken}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-white/40">
                      <Clock size={10} />
                      {inc.resolved ? `${inc.responseTime}m` : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {inc.resolved
                      ? <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle size={11} /> Resolved
                        </span>
                      : <span className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-400">
                          <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                            <Clock size={11} />
                          </motion.div>
                          Active
                        </span>
                    }
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
