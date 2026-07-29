import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { SimulationScenario, ScenarioType } from '../../types';
import { Sounds } from '../../utils/sounds';
import { Zap } from 'lucide-react';

const scenarios: SimulationScenario[] = [
  { id: 'add_50',       label: '+50 Visitors',   icon: '👥', description: 'Add 50 visitors across all zones',        color: '#00d4ff' },
  { id: 'add_100',      label: '+100 Visitors',  icon: '👥', description: 'Add 100 visitors — minor surge',          color: '#00d4ff' },
  { id: 'add_500',      label: '+500 Visitors',  icon: '🌊', description: 'Major influx — all agents respond',       color: '#fb923c' },
  { id: 'bus_arrives',  label: 'Bus Arrives',    icon: '🚌', description: '180 passengers arrive at Gate A',         color: '#fbbf24' },
  { id: 'rain_starts',  label: 'Rain Starts',    icon: '🌧', description: 'Visitors rush to covered areas',          color: '#60a5fa' },
  { id: 'vip_arrival',  label: 'VIP Arrival',    icon: '⭐', description: 'VIP fast-track lane activated',           color: '#a855f7' },
  { id: 'concert_starts', label: 'Concert Starts', icon: '🎵', description: 'Main stage crowd surges 800+',         color: '#ec4899' },
  { id: 'emergency',    label: 'Emergency',      icon: '🚨', description: 'Medical incident — all units on alert',  color: '#f43f5e' },
  { id: 'power_failure', label: 'Power Failure', icon: '⚡', description: 'Food Court sector blackout',              color: '#f43f5e' },
  { id: 'event_ends',   label: 'Event Ends',     icon: '🏁', description: 'Crowd evacuation to exits begins',       color: '#00f5a0' },
];

interface Props { compact?: boolean }

export default function ScenarioSimulator({ compact }: Props) {
  const { triggerScenario, activeScenario } = useEventStore();
  const items = compact ? scenarios.slice(0, 6) : scenarios;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <Zap size={15} style={{ color: '#fb923c' }} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white leading-none">Scenario Simulator</p>
          <p className="text-[10px] text-white/35 mt-0.5">Trigger live scenarios — watch all 6 AI agents respond</p>
        </div>
      </div>

      {/* Scenario grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((s, i) => {
          const isActive = activeScenario === s.id;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.04, y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { triggerScenario(s.id as ScenarioType); Sounds.trigger?.(); }}
              className="relative flex flex-col items-center gap-2 p-3.5 rounded-xl text-center overflow-hidden transition-all duration-200"
              style={isActive ? {
                background: `${s.color}15`,
                border: `1px solid ${s.color}50`,
                boxShadow: `0 0 20px ${s.color}35`,
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Active flash border */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  style={{ border: `2px solid ${s.color}` }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.5, repeat: 5 }}
                />
              )}

              {/* Color dot */}
              <div className="w-1.5 h-1.5 rounded-full absolute top-2.5 right-2.5"
                style={{ background: s.color, boxShadow: isActive ? `0 0 6px ${s.color}` : 'none' }} />

              <span className="text-2xl leading-none select-none">{s.icon}</span>
              <span className="text-[11px] font-semibold text-white/80 leading-tight">{s.label}</span>
              <span className="text-[9px] text-white/30 leading-tight">{s.description}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Active banner */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-5 py-3"
            style={{ borderTop: '1px solid rgba(0,212,255,0.15)', background: 'rgba(0,212,255,0.05)' }}>
            <span className="live-dot" />
            <span className="text-[11px] font-mono text-cyan-400">Scenario active — all agents responding in real time...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
