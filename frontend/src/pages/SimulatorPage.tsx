import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import type { ScenarioType } from '../types';
import { Zap, ArrowRight, Clock, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';

const SCENARIO_GROUPS = [
  {
    label: 'Crowd Events',
    color: '#00d4ff',
    scenarios: [
      { id: 'add_50',      label: '+50 Visitors',   icon: '👥', description: 'Minor visitor influx across all zones' },
      { id: 'add_100',     label: '+100 Visitors',  icon: '👥', description: 'Moderate surge — agents monitor' },
      { id: 'add_500',     label: '+500 Visitors',  icon: '🌊', description: 'Major influx — all agents respond' },
      { id: 'bus_arrives', label: 'Bus Arrives',    icon: '🚌', description: '180 passengers arrive at Gate A' },
    ],
  },
  {
    label: 'Venue Events',
    color: '#a855f7',
    scenarios: [
      { id: 'rain_starts',    label: 'Rain Starts',    icon: '🌧️', description: 'Visitors rush to covered areas' },
      { id: 'vip_arrival',    label: 'VIP Arrival',    icon: '⭐', description: 'VIP fast-track lane activated' },
      { id: 'concert_starts', label: 'Concert Starts', icon: '🎵', description: 'Main stage crowd surges +800' },
      { id: 'event_ends',     label: 'Event Ends',     icon: '🏁', description: 'Crowd evacuation to exits begins' },
    ],
  },
  {
    label: 'Emergencies',
    color: '#f43f5e',
    scenarios: [
      { id: 'emergency',     label: 'Medical Emergency', icon: '🚨', description: 'Medical incident — all units alert' },
      { id: 'power_failure', label: 'Power Failure',     icon: '⚡', description: 'Food Court sector blackout' },
    ],
  },
] as const;

type ScenarioId = typeof SCENARIO_GROUPS[number]['scenarios'][number]['id'];

interface FiredEvent {
  id: string;
  label: string;
  icon: string;
  groupColor: string;
  firedAt: Date;
  alertsAdded: number;
  agentMsgsAdded: number;
  timelineAdded: number;
}

const typeIcon = (type: string) => {
  if (type === 'critical') return <AlertTriangle size={10} className="text-red-400 flex-shrink-0" />;
  if (type === 'warning')  return <AlertTriangle size={10} className="text-yellow-400 flex-shrink-0" />;
  if (type === 'action')   return <Zap size={10} className="text-cyan-400 flex-shrink-0" />;
  if (type === 'resolved') return <CheckCircle size={10} className="text-emerald-400 flex-shrink-0" />;
  return <Info size={10} className="text-white/30 flex-shrink-0" />;
};

const agentColor: Record<string, string> = {
  orchestrator: '#00d4ff', crowd: '#a855f7', parking: '#fbbf24',
  gate: '#00f5a0', ticket: '#60a5fa', emergency: '#f43f5e', analytics: '#fb923c',
};

export default function SimulatorPage() {
  const { triggerScenario, activeScenario, alerts, agentMessages, timeline } = useEventStore();
  const [history, setHistory] = useState<FiredEvent[]>([]);
  const [lastFired, setLastFired] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'agents'>('timeline');

  const fire = (id: ScenarioId, label: string, icon: string, groupColor: string) => {
    const beforeAlerts   = alerts.length;
    const beforeMsgs     = agentMessages.length;
    const beforeTimeline = timeline.length;

    triggerScenario(id as ScenarioType);

    setTimeout(() => {
      const store = useEventStore.getState();
      setHistory(prev => [{
        id, label, icon, groupColor,
        firedAt: new Date(),
        alertsAdded:    store.alerts.length - beforeAlerts,
        agentMsgsAdded: store.agentMessages.length - beforeMsgs,
        timelineAdded:  store.timeline.length - beforeTimeline,
      }, ...prev.slice(0, 7)]);
      setLastFired(id);
      setTimeout(() => setLastFired(null), 3000);
    }, 50);
  };

  const recentTimeline = [...timeline].reverse().slice(0, 8);
  const recentMsgs     = [...agentMessages].reverse().slice(0, 6);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      <div>
        <h1 className="page-title">Scenario Simulator</h1>
        <p className="page-subtitle">Trigger real-world events and watch every agent, alert, and timeline entry respond live</p>
      </div>

      {/* Active scenario banner */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <span className="live-dot" />
            <span className="text-[12px] font-mono text-cyan-400">
              Scenario active — agents responding across dashboard, alerts, heatmap and timeline…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: scenario groups ── */}
        <div className="xl:col-span-1 space-y-3">
          {SCENARIO_GROUPS.map(group => (
            <div key={group.label} className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: `${group.color}08` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: group.color }}>
                  {group.label}
                </p>
              </div>
              {/* Scenario buttons */}
              <div className="p-2 space-y-1">
                {group.scenarios.map((s, i) => {
                  const isActive = activeScenario === s.id || lastFired === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => fire(s.id as ScenarioId, s.label, s.icon, group.color)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={isActive ? {
                        background: `${group.color}12`,
                        border: `1px solid ${group.color}45`,
                        boxShadow: `0 0 14px ${group.color}20`,
                      } : {
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <span className="text-lg leading-none select-none flex-shrink-0">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white leading-none mb-0.5">{s.label}</p>
                        <p className="text-[10px] text-white/30 truncate">{s.description}</p>
                      </div>
                      {isActive ? (
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: group.color, boxShadow: `0 0 6px ${group.color}` }}
                        />
                      ) : (
                        <ArrowRight size={11} className="text-white/15 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Session history */}
          {history.length > 0 && (
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <TrendingUp size={11} className="text-white/25" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Fired This Session</p>
              </div>
              <div className="p-2 space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                    style={{ background: `${h.groupColor}08`, border: `1px solid ${h.groupColor}18` }}>
                    <span className="text-base leading-none">{h.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white/80">{h.label}</p>
                      <p className="text-[9px] font-mono text-white/25">
                        {[
                          h.alertsAdded > 0    && `+${h.alertsAdded} alert`,
                          h.agentMsgsAdded > 0 && `+${h.agentMsgsAdded} msgs`,
                          h.timelineAdded > 0  && `+${h.timelineAdded} events`,
                        ].filter(Boolean).join('  ') || 'no new entries'}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-white/20 flex-shrink-0">
                      {h.firedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: live consequence feed ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* What to expect callout */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: '🗺️', label: 'Zone Map',   desc: 'Crowd counts update live' },
              { icon: '🚨', label: 'Alerts',     desc: 'New alerts appear instantly' },
              { icon: '🤖', label: 'Agents',     desc: 'Messages route between agents' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xl leading-none">{item.icon}</span>
                <div>
                  <p className="text-[11px] font-bold text-white/70">{item.label}</p>
                  <p className="text-[9px] text-white/30">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl w-fit"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { id: 'timeline', label: 'Timeline Events', icon: <Clock size={11} /> },
              { id: 'agents',   label: 'Agent Responses', icon: <span className="text-xs">🤖</span> },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                style={activeTab === tab.id
                  ? { background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Feed panel */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2">
                {activeTab === 'timeline'
                  ? <><Clock size={13} className="text-white/30" /><p className="text-[12px] font-bold text-white">Live Timeline</p></>
                  : <><span className="text-sm">🤖</span><p className="text-[12px] font-bold text-white">Agent Responses</p></>
                }
                <span className="live-dot w-1.5 h-1.5 ml-1" />
              </div>
              <span className="text-[10px] font-mono text-white/25">
                {activeTab === 'timeline' ? `${timeline.length} events` : `${agentMessages.length} msgs`}
              </span>
            </div>

            <div className="p-3 space-y-1.5 min-h-[200px]">
              <AnimatePresence mode="popLayout">
                {activeTab === 'timeline'
                  ? recentTimeline.map(evt => (
                    <motion.div key={evt.id} layout
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {typeIcon(evt.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[11px] font-bold text-white/85">{evt.title}</p>
                          {evt.agent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: `${agentColor[evt.agent] ?? '#fff'}15`, color: agentColor[evt.agent] ?? '#fff' }}>
                              {evt.agent}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-white/35">{evt.description}</p>
                      </div>
                      <span className="text-[9px] font-mono text-white/20 flex-shrink-0">
                        {evt.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </motion.div>
                  ))
                  : recentMsgs.map(msg => (
                    <motion.div key={msg.id} layout
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold capitalize"
                            style={{ color: agentColor[msg.from] ?? '#fff' }}>{msg.from}</span>
                          <ArrowRight size={9} className="text-white/20 flex-shrink-0" />
                          <span className="text-[10px] font-bold capitalize"
                            style={{ color: agentColor[msg.to] ?? '#fff' }}>{msg.to}</span>
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                            style={{
                              background: msg.type === 'action' ? 'rgba(0,212,255,0.15)'
                                : msg.type === 'warning' ? 'rgba(251,191,36,0.15)'
                                : 'rgba(255,255,255,0.06)',
                              color: msg.type === 'action' ? '#00d4ff'
                                : msg.type === 'warning' ? '#fbbf24'
                                : 'rgba(255,255,255,0.3)',
                            }}>
                            {msg.type}
                          </span>
                          <span className="ml-auto text-[9px] font-mono text-white/20 flex-shrink-0">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/55 leading-snug">{msg.message}</p>
                      </div>
                    </motion.div>
                  ))
                }
              </AnimatePresence>
              {activeTab === 'timeline' && recentTimeline.length === 0 && (
                <p className="text-[11px] text-white/20 text-center py-8">Fire a scenario to see timeline events</p>
              )}
              {activeTab === 'agents' && recentMsgs.length === 0 && (
                <p className="text-[11px] text-white/20 text-center py-8">Agent messages will appear here</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
