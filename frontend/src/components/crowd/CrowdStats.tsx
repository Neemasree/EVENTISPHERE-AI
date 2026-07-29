import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskBg, occupancyColor } from '../../utils/helpers';
import AnimatedCounter from '../common/AnimatedCounter';

export default function CrowdStats() {
  const { zones, kpi } = useEventStore();

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Current Visitors', value: kpi.currentCrowd, suffix: '' },
          { label: 'Max Capacity',     value: kpi.totalCapacity, suffix: '' },
          { label: 'Occupancy',        value: kpi.occupancyPercent, suffix: '%' },
          { label: 'Avg Wait',         value: kpi.avgWaitTime, suffix: ' min' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-white font-mono">
              <AnimatedCounter value={s.value} suffix={s.suffix} />
            </p>
          </motion.div>
        ))}
      </div>

      {/* Zone table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-sm font-semibold text-white">Zone Details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-white/40 uppercase tracking-wider text-left">
                <th className="px-4 py-2 font-medium">Zone</th>
                <th className="px-4 py-2 font-medium">Crowd</th>
                <th className="px-4 py-2 font-medium">Capacity</th>
                <th className="px-4 py-2 font-medium">Occupancy</th>
                <th className="px-4 py-2 font-medium">Wait</th>
                <th className="px-4 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => (
                <motion.tr key={zone.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-white/80">{zone.name}</td>
                  <td className="px-4 py-2.5 font-mono text-white">{zone.currentCrowd.toLocaleString()}</td>
                  <td className="px-4 py-2.5 font-mono text-white/40">{zone.maxCapacity.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden w-16">
                        <div className="h-full rounded-full" style={{ width: `${zone.occupancy}%`, background: occupancyColor(zone.occupancy) }} />
                      </div>
                      <span className="font-mono text-white/70 w-8 text-right">{zone.occupancy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-white/60">{zone.waitingTime}m</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${riskBg(zone.riskLevel)}`}>
                      {zone.riskLevel}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
