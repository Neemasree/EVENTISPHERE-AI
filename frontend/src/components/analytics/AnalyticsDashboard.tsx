import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { ReactNode } from 'react';

const hourlyData = [
  { hour: '14:00', visitors: 1200, capacity: 8000, incidents: 0 },
  { hour: '15:00', visitors: 3400, capacity: 8000, incidents: 1 },
  { hour: '16:00', visitors: 5800, capacity: 8000, incidents: 2 },
  { hour: '17:00', visitors: 7200, capacity: 8000, incidents: 1 },
  { hour: '18:00', visitors: 8100, capacity: 8000, incidents: 3 },
  { hour: '19:00', visitors: 7600, capacity: 8000, incidents: 2 },
  { hour: '20:00', visitors: 6200, capacity: 8000, incidents: 1 },
  { hour: '21:00', visitors: 4800, capacity: 8000, incidents: 0 },
];

const zoneBar = [
  { name: 'Main Stage', avg: 64, peak: 84 },
  { name: 'Food Court', avg: 82, peak: 97 },
  { name: 'Gate A',     avg: 71, peak: 88 },
  { name: 'Parking A',  avg: 78, peak: 92 },
  { name: 'Restrooms',  avg: 68, peak: 79 },
  { name: 'VIP',        avg: 28, peak: 40 },
];

const densityPie = [
  { name: 'Low (0–60%)',      value: 3, color: '#00f5a0' },
  { name: 'Medium (60–80%)',  value: 4, color: '#fbbf24' },
  { name: 'High (80–95%)',    value: 3, color: '#fb923c' },
  { name: 'Critical (95%+)', value: 2, color: '#f43f5e' },
];

const flowRate = [
  { time: '14:00', inflow: 320, outflow: 80  },
  { time: '15:00', inflow: 480, outflow: 120 },
  { time: '16:00', inflow: 520, outflow: 160 },
  { time: '17:00', inflow: 390, outflow: 240 },
  { time: '18:00', inflow: 260, outflow: 300 },
  { time: '19:00', inflow: 180, outflow: 340 },
  { time: '20:00', inflow: 90,  outflow: 420 },
];

const tooltipStyle = {
  backgroundColor: 'rgba(8,15,32,0.97)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '11px',
  color: '#fff',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  backdropFilter: 'blur(20px)',
};

const axisStyle = { fill: 'rgba(255,255,255,0.3)', fontSize: 10 };

function ChartCard({ title, subtitle, children, delay = 0 }: {
  title: string; subtitle?: string; children: ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute top-0 left-6 right-6 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.3), transparent)' }} />
      <p className="text-[13px] font-bold text-white mb-0.5">{title}</p>
      {subtitle && <p className="text-[11px] text-white/35 mb-4">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const { kpi } = useEventStore();

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Peak Hour',   value: '18:00',          sub: '8,100 visitors',   color: '#00d4ff' },
          { label: 'Peak Zone',   value: kpi.peakZone,     sub: 'Highest density',  color: '#a855f7' },
          { label: 'Avg Density', value: `${kpi.occupancyPercent}%`, sub: 'Across all zones', color: '#fbbf24' },
          { label: 'Flow Rate',   value: `${kpi.flowRate}/min`, sub: 'Current throughput', color: '#00f5a0' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-4 text-center relative overflow-hidden"
            style={{
              background: `${s.color}08`,
              border: `1px solid ${s.color}20`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px"
              style={{ background: s.color }} />
            <p className="text-[9px] text-white/35 uppercase tracking-widest mb-2 font-bold">{s.label}</p>
            <p className="text-lg font-bold font-mono leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-white/30">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Visitor flow */}
      <ChartCard title="Visitor Flow Over Time" subtitle="Hourly attendance vs. venue capacity" delay={0.1}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
            <Area type="monotone" dataKey="capacity" stroke="#a855f7" fill="url(#capGrad)" strokeWidth={1.5} strokeDasharray="4 3" name="Capacity" />
            <Area type="monotone" dataKey="visitors"  stroke="#00d4ff" fill="url(#visGrad)" strokeWidth={2}   name="Visitors" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Zone occupancy */}
        <ChartCard title="Zone Occupancy" subtitle="Average vs. peak per zone" delay={0.15}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={zoneBar} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
              <Bar dataKey="avg"  fill="#00d4ff" radius={[4,4,0,0]} name="Avg %"  opacity={0.8} />
              <Bar dataKey="peak" fill="#fb923c" radius={[4,4,0,0]} name="Peak %" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Density distribution */}
        <ChartCard title="Density Distribution" subtitle="Zones by current risk level" delay={0.2}>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={densityPie} cx="50%" cy="50%" innerRadius={46} outerRadius={72}
                  dataKey="value" strokeWidth={0} paddingAngle={2}>
                  {densityPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 flex-1">
              {densityPie.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: d.color, boxShadow: `0 0 4px ${d.color}` }} />
                  <span className="text-[11px] text-white/55 flex-1">{d.name}</span>
                  <span className="text-[12px] font-bold font-mono" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Inflow vs outflow */}
      <ChartCard title="Inflow vs. Outflow" subtitle="People entering and leaving per hour" delay={0.25}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={flowRate}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }} />
            <Line type="monotone" dataKey="inflow"  stroke="#00f5a0" strokeWidth={2.5} dot={false} name="Inflow"  />
            <Line type="monotone" dataKey="outflow" stroke="#fb923c" strokeWidth={2.5} dot={false} name="Outflow" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Incidents per hour */}
      <ChartCard title="Incidents Per Hour" subtitle="Alert and incident frequency over the event" delay={0.3}>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="incidents" name="Incidents" radius={[4,4,0,0]}>
              {hourlyData.map((entry, i) => (
                <Cell key={i} fill={
                  entry.incidents >= 3 ? '#f43f5e'
                  : entry.incidents >= 2 ? '#fb923c'
                  : '#fbbf24'
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
