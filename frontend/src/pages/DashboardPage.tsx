import { motion } from 'framer-motion';
import { Users, Bell, Shield, Clock, MapPin, Cpu } from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import KPICard from '../components/dashboard/KPICard';
import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import AlertCenter from '../components/alerts/AlertCenter';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function DashboardPage() {
  const { kpi, alerts } = useEventStore();
  const activeAlerts  = alerts.filter(a => !a.dismissed);
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  const kpiCards = [
    { title: 'Visitors',      value: kpi.currentCrowd,   icon: <Users size={16} />,  color: '#00d4ff', subtitle: `of ${kpi.totalCapacity.toLocaleString()}`, trend: 'up' as const, trendValue: '+240/hr' },
    { title: 'Active Alerts', value: activeAlerts.length, icon: <Bell size={16} />,   color: activeAlerts.length > 2 ? '#f43f5e' : '#fbbf24', subtitle: `${criticalCount} critical`, critical: criticalCount > 0 },
    { title: 'Risk Level',    value: kpi.riskLevel.toUpperCase(), icon: <Shield size={16} />, color: kpi.riskLevel === 'critical' ? '#f43f5e' : kpi.riskLevel === 'high' ? '#fb923c' : kpi.riskLevel === 'medium' ? '#fbbf24' : '#00f5a0', subtitle: 'Overall', animate: false, critical: kpi.riskLevel === 'critical' },
    { title: 'Avg Wait',      value: kpi.avgWaitTime,    icon: <Clock size={16} />,  color: kpi.avgWaitTime > 8 ? '#fb923c' : '#00f5a0', suffix: ' min', subtitle: 'Across zones' },
    { title: 'Peak Zone',     value: kpi.peakZone,       icon: <MapPin size={16} />, color: '#a855f7', subtitle: 'Highest occupancy', animate: false },
    { title: 'AI Agents',     value: '7 / 7',            icon: <Cpu size={16} />,    color: '#00f5a0', subtitle: 'All online', animate: false },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div>
        <h1 className="page-title">Mission Control</h1>
        <p className="page-subtitle">Live event overview — all systems nominal</p>
      </div>

      {/* KPI row */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card, i) => (
          <KPICard key={card.title} {...card} delay={i * 0.05} />
        ))}
      </motion.div>

      {/* Main row — Venue map + Risk + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Venue map — 3 cols */}
        <motion.div className="xl:col-span-3" {...fadeUp(0.1)}>
          <p className="section-label">Venue Map</p>
          <DigitalTwinVenue compact />
        </motion.div>

        {/* Right — Risk meter + Alerts */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          <motion.div {...fadeUp(0.15)}>
            <p className="section-label">Active Alerts</p>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <AlertCenter compact maxItems={3} />
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
