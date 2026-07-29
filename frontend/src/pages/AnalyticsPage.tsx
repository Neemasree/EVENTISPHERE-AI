import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEventStore } from '../store/eventStore';

export default function AnalyticsPage() {
  const { zones, alerts, incidents, kpi } = useEventStore();

  const handleExport = () => {
    const rows = [
      ['Zone', 'Occupancy %', 'Current Crowd', 'Max Capacity', 'Risk Level', 'Wait Time (min)'],
      ...zones.map(z => [z.name, z.occupancy, z.currentCrowd, z.maxCapacity, z.riskLevel, z.waitingTime]),
      [],
      ['Summary'],
      ['Total Visitors', kpi.currentCrowd],
      ['Total Capacity', kpi.totalCapacity],
      ['Occupancy %', kpi.occupancyPercent],
      ['Active Alerts', kpi.activeAlerts],
      ['Risk Level', kpi.riskLevel],
      ['Avg Wait (min)', kpi.avgWaitTime],
      [],
      ['Incidents', incidents.length],
      ['Resolved', incidents.filter(i => i.resolved).length],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'eventisphere-analytics.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Charts, trends, and AI-generated insights across all operational areas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          className="btn-ghost gap-2">
          <Download size={14} /> Export CSV
        </motion.button>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
