import { motion } from 'framer-motion';
import type { Zone, ZoneType } from '../../types';

export interface Template {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  zones: Omit<Zone, 'currentCrowd' | 'occupancy' | 'waitingTime' | 'riskLevel'>[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'concert',
    label: 'Music Concert',
    icon: '🎵',
    description: 'Main stage, food courts, multiple gates, VIP area',
    color: '#a855f7',
    zones: [
      { id: 'z_stage',   name: 'Main Stage',    type: 'stage',          x: 100, y: 160, width: 220, height: 120, maxCapacity: 5000 },
      { id: 'z_gate_a',  name: 'Gate A',        type: 'gate',           x: 20,  y: 100, width: 80,  height: 50,  maxCapacity: 500  },
      { id: 'z_gate_b',  name: 'Gate B',        type: 'gate',           x: 115, y: 100, width: 80,  height: 50,  maxCapacity: 500  },
      { id: 'z_gate_c',  name: 'Gate C',        type: 'gate',           x: 210, y: 100, width: 80,  height: 50,  maxCapacity: 500  },
      { id: 'z_food',    name: 'Food Court',    type: 'food',           x: 340, y: 100, width: 120, height: 75,  maxCapacity: 600  },
      { id: 'z_vip',     name: 'VIP Lounge',    type: 'vip',            x: 340, y: 20,  width: 100, height: 60,  maxCapacity: 150  },
      { id: 'z_park_a',  name: 'Parking A',     type: 'parking',        x: 20,  y: 20,  width: 120, height: 60,  maxCapacity: 500  },
      { id: 'z_park_b',  name: 'Parking B',     type: 'parking',        x: 160, y: 20,  width: 120, height: 60,  maxCapacity: 500  },
      { id: 'z_medical', name: 'Medical Bay',   type: 'medical',        x: 340, y: 190, width: 80,  height: 50,  maxCapacity: 50   },
      { id: 'z_wc',      name: 'Restrooms',     type: 'restroom',       x: 340, y: 255, width: 80,  height: 45,  maxCapacity: 120  },
      { id: 'z_exit',    name: 'Main Exit',     type: 'exit',           x: 20,  y: 310, width: 100, height: 45,  maxCapacity: 400  },
      { id: 'z_emer',    name: 'Emergency Exit',type: 'emergency_exit', x: 440, y: 175, width: 80,  height: 50,  maxCapacity: 1000 },
    ],
  },
  {
    id: 'stadium',
    label: 'Stadium',
    icon: '🏟️',
    description: 'Sports venue with multiple stands, parking, concessions',
    color: '#00d4ff',
    zones: [
      { id: 'z_field',   name: 'Playing Field', type: 'stage',          x: 120, y: 130, width: 260, height: 160, maxCapacity: 100  },
      { id: 'z_stand_n', name: 'North Stand',   type: 'vip',            x: 120, y: 80,  width: 260, height: 45,  maxCapacity: 8000 },
      { id: 'z_stand_s', name: 'South Stand',   type: 'vip',            x: 120, y: 295, width: 260, height: 45,  maxCapacity: 8000 },
      { id: 'z_gate_a',  name: 'Gate A',        type: 'gate',           x: 20,  y: 150, width: 80,  height: 50,  maxCapacity: 1000 },
      { id: 'z_gate_b',  name: 'Gate B',        type: 'gate',           x: 20,  y: 220, width: 80,  height: 50,  maxCapacity: 1000 },
      { id: 'z_gate_c',  name: 'Gate C',        type: 'gate',           x: 420, y: 150, width: 80,  height: 50,  maxCapacity: 1000 },
      { id: 'z_food',    name: 'Concessions',   type: 'food',           x: 20,  y: 20,  width: 120, height: 50,  maxCapacity: 400  },
      { id: 'z_park',    name: 'Parking',       type: 'parking',        x: 160, y: 20,  width: 200, height: 50,  maxCapacity: 2000 },
      { id: 'z_medical', name: 'Medical',       type: 'medical',        x: 420, y: 220, width: 80,  height: 50,  maxCapacity: 30   },
      { id: 'z_emer',    name: 'Emergency Exit',type: 'emergency_exit', x: 420, y: 295, width: 80,  height: 45,  maxCapacity: 2000 },
    ],
  },
  {
    id: 'conference',
    label: 'Conference',
    icon: '🏢',
    description: 'Tech/business event with halls, registration, networking',
    color: '#00f5a0',
    zones: [
      { id: 'z_hall_a',  name: 'Hall A',        type: 'stage',          x: 20,  y: 80,  width: 180, height: 100, maxCapacity: 1000 },
      { id: 'z_hall_b',  name: 'Hall B',        type: 'stage',          x: 220, y: 80,  width: 180, height: 100, maxCapacity: 800  },
      { id: 'z_reg',     name: 'Registration',  type: 'gate',           x: 160, y: 20,  width: 120, height: 50,  maxCapacity: 300  },
      { id: 'z_network', name: 'Networking',    type: 'vip',            x: 20,  y: 200, width: 150, height: 80,  maxCapacity: 400  },
      { id: 'z_food',    name: 'Cafeteria',     type: 'food',           x: 190, y: 200, width: 130, height: 80,  maxCapacity: 300  },
      { id: 'z_park',    name: 'Parking',       type: 'parking',        x: 340, y: 200, width: 120, height: 80,  maxCapacity: 400  },
      { id: 'z_medical', name: 'First Aid',     type: 'medical',        x: 340, y: 80,  width: 80,  height: 50,  maxCapacity: 20   },
      { id: 'z_exit',    name: 'Main Exit',     type: 'exit',           x: 20,  y: 300, width: 100, height: 45,  maxCapacity: 500  },
      { id: 'z_emer',    name: 'Emergency Exit',type: 'emergency_exit', x: 340, y: 300, width: 80,  height: 45,  maxCapacity: 500  },
    ],
  },
  {
    id: 'exhibition',
    label: 'Exhibition',
    icon: '🎪',
    description: 'Expo/trade show with stalls, demo areas, lounges',
    color: '#fb923c',
    zones: [
      { id: 'z_main',    name: 'Main Hall',     type: 'stage',          x: 80,  y: 80,  width: 300, height: 180, maxCapacity: 3000 },
      { id: 'z_gate_a',  name: 'Entry Gate',    type: 'gate',           x: 180, y: 20,  width: 100, height: 50,  maxCapacity: 600  },
      { id: 'z_food',    name: 'Food Zone',     type: 'food',           x: 20,  y: 80,  width: 50,  height: 80,  maxCapacity: 200  },
      { id: 'z_vip',     name: 'VIP Lounge',    type: 'vip',            x: 20,  y: 170, width: 50,  height: 90,  maxCapacity: 100  },
      { id: 'z_park',    name: 'Parking',       type: 'parking',        x: 20,  y: 20,  width: 140, height: 50,  maxCapacity: 600  },
      { id: 'z_medical', name: 'Medical',       type: 'medical',        x: 390, y: 80,  width: 70,  height: 50,  maxCapacity: 20   },
      { id: 'z_wc',      name: 'Restrooms',     type: 'restroom',       x: 390, y: 140, width: 70,  height: 50,  maxCapacity: 80   },
      { id: 'z_exit',    name: 'Exit',          type: 'exit',           x: 180, y: 270, width: 100, height: 45,  maxCapacity: 600  },
      { id: 'z_emer',    name: 'Emergency Exit',type: 'emergency_exit', x: 390, y: 200, width: 70,  height: 45,  maxCapacity: 800  },
    ],
  },
  {
    id: 'college',
    label: 'College Fest',
    icon: '🎓',
    description: 'Campus event with open stage, food stalls, activities',
    color: '#fbbf24',
    zones: [
      { id: 'z_stage',   name: 'Open Stage',    type: 'stage',          x: 120, y: 150, width: 180, height: 100, maxCapacity: 2000 },
      { id: 'z_gate_a',  name: 'Main Gate',     type: 'gate',           x: 20,  y: 150, width: 80,  height: 50,  maxCapacity: 400  },
      { id: 'z_gate_b',  name: 'Side Gate',     type: 'gate',           x: 320, y: 150, width: 80,  height: 50,  maxCapacity: 300  },
      { id: 'z_food_a',  name: 'Food Stalls A', type: 'food',           x: 20,  y: 220, width: 100, height: 60,  maxCapacity: 200  },
      { id: 'z_food_b',  name: 'Food Stalls B', type: 'food',           x: 300, y: 220, width: 100, height: 60,  maxCapacity: 200  },
      { id: 'z_activity',name: 'Activity Zone', type: 'vip',            x: 120, y: 270, width: 180, height: 70,  maxCapacity: 500  },
      { id: 'z_medical', name: 'First Aid',     type: 'medical',        x: 20,  y: 20,  width: 80,  height: 50,  maxCapacity: 20   },
      { id: 'z_park',    name: 'Parking',       type: 'parking',        x: 120, y: 20,  width: 200, height: 60,  maxCapacity: 300  },
      { id: 'z_emer',    name: 'Emergency Exit',type: 'emergency_exit', x: 340, y: 20,  width: 80,  height: 50,  maxCapacity: 500  },
    ],
  },
  {
    id: 'blank',
    label: 'Blank Canvas',
    icon: '✦',
    description: 'Start from scratch with an empty canvas',
    color: 'rgba(255,255,255,0.4)',
    zones: [],
  },
];

interface Props {
  onSelect: (template: Template) => void;
}

export default function TemplateSelector({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TEMPLATES.map((t, i) => (
          <motion.button key={t.id}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(t)}
            className="flex flex-col items-start p-4 rounded-2xl text-left transition-all"
            style={{ background: `${t.color}08`, border: `1px solid ${t.color}25` }}>
            <span className="text-3xl mb-3">{t.icon}</span>
            <p className="text-[13px] font-bold text-white mb-1">{t.label}</p>
            <p className="text-[10px] text-white/35 leading-relaxed">{t.description}</p>
            {t.zones.length > 0 && (
              <span className="mt-3 text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}>
                {t.zones.length} zones
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
