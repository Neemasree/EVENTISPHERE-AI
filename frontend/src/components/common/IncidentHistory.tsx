import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { severityBg, formatTime } from '../../utils/helpers';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function IncidentHistory() {
  const incidents = useEventStore(s => s.incidents);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-orange-400" />
          <span className="text-sm font-semibold text-white">Incident History</span>
        </div>
        <span className="text-xs text-white/40">{incidents.length} incidents</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-white/30 uppercase tracking-wider text-left border-b border-white/5">
              <th className="px-4 py-2.5 font-medium">Severity</th>
              <th className="px-4 py-2.5 font-medium">Zone</th>
              <th className="px-4 py-2.5 font-medium">Time</th>
              <th className="px-4 py-2.5 font-medium">Description</th>
              <th className="px-4 py-2.5 font-medium">Action Taken</th>
              <th className="px-4 py-2.5 font-medium">Response</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc, i) => (
              <motion.tr key={inc.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${severityBg(inc.severity)}`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/80 font-medium">{inc.zone}</td>
                <td className="px-4 py-3 font-mono text-white/50">{formatTime(inc.time)}</td>
                <td className="px-4 py-3 text-white/60 max-w-[180px]">
                  <p className="truncate">{inc.description}</p>
                </td>
                <td className="px-4 py-3 text-white/60 max-w-[180px]">
                  <p className="truncate">{inc.actionTaken}</p>
                </td>
                <td className="px-4 py-3 font-mono text-white/50">
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    {inc.resolved ? `${inc.responseTime} min` : '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {inc.resolved
                    ? <span className="flex items-center gap-1 text-green-400 font-semibold"><CheckCircle size={11} />Resolved</span>
                    : <span className="flex items-center gap-1 text-orange-400 font-semibold animate-pulse"><Clock size={11} />Active</span>
                  }
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
