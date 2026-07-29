import { motion } from 'framer-motion';
import { Users, Building2, Activity, Bell, Cpu, Clock, MapPin, Shield, TrendingUp } from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import HeroSection from '../components/dashboard/HeroSection';
import KPICard from '../components/dashboard/KPICard';
import AgentStatusBar from '../components/dashboard/AgentStatusBar';
import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import AlertCenter from '../components/alerts/AlertCenter';
import RiskMeter from '../components/crowd/RiskMeter';
import AIRecommendations from '../components/ai/AIRecommendations';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';
import { riskBg } from '../utils/helpers';

export default function DashboardPage() {
  const { kpi, alerts } = useEventStore();
  const activeAlerts = alerts.filter(a => !a.dismissed);

  const kpiCards = [
    {
      title: 'Current Crowd', value: kpi.currentCrowd, icon: <Users size={18} />,
      color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', glowColor: 'rgba(0,212,255,0.08)',
      subtitle: `of ${kpi.totalCapacity.toLocaleString()} capacity`, trend: 'up' as const, trendValue: '+240/hr',
    },
    {
      title: 'Occupancy', value: kpi.occupancyPercent, icon: <Building2 size={18} />,
      color: kpi.occupancyPercent >= 80 ? 'text-orange-400' : 'text-green-400',
      bgColor: kpi.occupancyPercent >= 80 ? 'bg-orange-500/20' : 'bg-green-500/20',
      glowColor: kpi.occupancyPercent >= 80 ? 'rgba(249,115,22,0.08)' : 'rgba(0,255,136,0.08)',
      suffix: '%', subtitle: `Peak: ${kpi.peakZone}`,
    },
    {
      title: 'Active Alerts', value: activeAlerts.length, icon: <Bell size={18} />,
      color: activeAlerts.length > 2 ? 'text-red-400' : 'text-yellow-400',
      bgColor: activeAlerts.length > 2 ? 'bg-red-500/20' : 'bg-yellow-500/20',
      glowColor: activeAlerts.length > 2 ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
      subtitle: `${activeAlerts.filter(a => a.severity === 'critical').length} critical`,
    },
    {
      title: 'AI Recommendations', value: kpi.aiRecommendations, icon: <Cpu size={18} />,
      color: 'text-purple-400', bgColor: 'bg-purple-500/20', glowColor: 'rgba(168,85,247,0.08)',
      subtitle: 'Pending approval',
    },
    {
      title: 'Avg Wait Time', value: kpi.avgWaitTime, icon: <Clock size={18} />,
      color: kpi.avgWaitTime > 8 ? 'text-orange-400' : 'text-green-400',
      bgColor: kpi.avgWaitTime > 8 ? 'bg-orange-500/20' : 'bg-green-500/20',
      glowColor: 'rgba(0,212,255,0.06)', suffix: ' min',
      subtitle: 'Across all zones',
    },
    {
      title: 'Flow Rate', value: kpi.flowRate, icon: <TrendingUp size={18} />,
      color: 'text-green-400', bgColor: 'bg-green-500/20', glowColor: 'rgba(0,255,136,0.08)',
      suffix: '/min', subtitle: 'People per minute',
    },
    {
      title: 'Peak Zone', value: kpi.peakZone, icon: <MapPin size={18} />,
      color: 'text-orange-400', bgColor: 'bg-orange-500/20', glowColor: 'rgba(249,115,22,0.08)',
      subtitle: 'Highest density', animate: false,
    },
    {
      title: 'Risk Level', value: kpi.riskLevel.toUpperCase(), icon: <Shield size={18} />,
      color: kpi.riskLevel === 'critical' ? 'text-red-400' : kpi.riskLevel === 'high' ? 'text-orange-400' : kpi.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400',
      bgColor: kpi.riskLevel === 'critical' ? 'bg-red-500/20' : kpi.riskLevel === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20',
      glowColor: 'rgba(239,68,68,0.06)', subtitle: 'Overall assessment', animate: false,
    },
    {
      title: 'Agent Status', value: 'ACTIVE', icon: <Activity size={18} />,
      color: 'text-green-400', bgColor: 'bg-green-500/20', glowColor: 'rgba(0,255,136,0.08)',
      subtitle: '6/7 agents running', animate: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <HeroSection />

      {/* KPI Grid */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {kpiCards.map((card, i) => (
            <KPICard key={card.title} {...card} delay={i * 0.05} />
          ))}
        </div>
      </section>

      {/* Agent Status Bar */}
      <section>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Agent Status</p>
        <AgentStatusBar />
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Digital Twin - spans 2 cols */}
        <div className="xl:col-span-2">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Digital Twin Venue</p>
          <DigitalTwinVenue compact />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Overall Risk</p>
            <RiskMeter />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Active Alerts</p>
            <AlertCenter compact maxItems={3} />
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">AI Recommendations</p>
          <AIRecommendations compact />
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Agent Communications</p>
          <AgentCommsPanel compact />
        </div>
      </div>
    </div>
  );
}
