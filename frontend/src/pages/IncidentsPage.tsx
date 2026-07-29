import IncidentHistory from '../components/common/IncidentHistory';
import { useEventStore } from '../store/eventStore';

export default function IncidentsPage() {
  const incidents = useEventStore(s => s.incidents);
  const resolved = incidents.filter(i => i.resolved).length;
  const active   = incidents.filter(i => !i.resolved).length;
  const avgResponse = incidents.filter(i => i.resolved && i.responseTime > 0)
    .reduce((s, i, _, a) => s + i.responseTime / a.length, 0).toFixed(1);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-header">Incident History</h1>
        <p className="page-sub">Full log of all detected incidents, responses, and resolution times</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Incidents', value: incidents.length, color: 'text-white' },
          { label: 'Resolved',        value: resolved,          color: 'text-green-400' },
          { label: 'Active',          value: active,            color: active > 0 ? 'text-red-400 animate-pulse' : 'text-white/40' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <IncidentHistory />
    </div>
  );
}
