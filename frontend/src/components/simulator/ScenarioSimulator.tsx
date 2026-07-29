import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { SimulationScenario, ScenarioType } from '../../types';
import { Sounds } from '../../utils/sounds';

const scenarios: SimulationScenario[] = [
  { id: 'add_50',       label: '+50 Visitors',    icon: '👥', description: 'Add 50 visitors across zones',           color: '#00d4ff' },
  { id: 'add_100',      label: '+100 Visitors',   icon: '👥', description: 'Add 100 visitors — minor surge',         color: '#00d4ff' },
  { id: 'add_500',      label: '+500 Visitors',   icon: '🌊', description: 'Major influx — all agents respond',      color: '#f97316' },
  { id: 'bus_arrives',  label: 'Bus Arrives',     icon: '🚌', description: '180 passengers at Gate A',               color: '#fbbf24' },
  { id: 'rain_starts',  label: 'Rain Starts',     icon: '🌧️', description: 'Visitors rush to covered areas',         color: '#60a5fa' },
  { id: 'vip_arrival',  label: 'VIP Arrival',     icon: '⭐', description: 'VIP lane activated at Gate A',           color: '#a855f7' },
  { id: 'concert_starts', label: 'Concert Starts', icon: '🎵', description: 'Main stage crowd surges 800+',          color: '#ec4899' },
  { id: 'emergency',    label: 'Emergency',       icon: '🚨', description: 'Medical incident — all agents on alert', color: '#ef4444' },
  { id: 'power_failure', label: 'Power Failure',  icon: '⚡', description: 'Food Court sector outage',               color: '#ef4444' },
  { id: 'event_ends',   label: 'Event Ends',      icon: '🏁', description: 'Crowd evacuation to exits',              color: '#00ff88' },
];

interface Props { compact?: boolean }

export default function ScenarioSimulator({ compact }: Props) {
  const { triggerScenario, activeScenario } = useEventStore();
  const items = compact ? scenarios.slice(0, 6) : scenarios;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-sm font-semibold text-white">Scenario Simulator</p>
        <p className="text-xs text-white/40 mt-0.5">Trigger live scenarios and watch all agents respond in real time</p>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {items.map((s, i) => {
          const isActive = activeScenario === s.id;
          return (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { triggerScenario(s.id as ScenarioType); Sounds.trigger(); }}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 text-center
                ${isActive ? 'border-opacity-80 bg-opacity-20' : 'border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20'}`}
              style={isActive ? { borderColor: s.color, background: `${s.color}18`, boxShadow: `0 0 20px ${s.color}40` } : {}}
            >
              {isActive && (
                <motion.div className="absolute inset-0 rounded-xl border-2"
                  style={{ borderColor: s.color }}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.6, repeat: 4 }}
                />
              )}
              <span className="text-2xl leading-none">{s.icon}</span>
              <span className="text-xs font-semibold text-white/80 leading-tight">{s.label}</span>
              <span className="text-[9px] text-white/30 leading-tight">{s.description}</span>
            </motion.button>
          );
        })}
      </div>
      {activeScenario && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="px-4 pb-3 text-xs text-cyan-400 font-mono flex items-center gap-2">
          <span className="live-dot" />
          Scenario active — all agents responding...
        </motion.div>
      )}
    </div>
  );
}
