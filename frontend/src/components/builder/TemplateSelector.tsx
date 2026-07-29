import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronLeft, Trash2 } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import { TOOLS } from './BuilderToolbar';

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

// ── Zone row used inside the custom template builder ──────────────────────────
interface ZoneRow {
  id: string;
  name: string;
  type: ZoneType;
  maxCapacity: number;
}

const ICON_OPTIONS = ['🎵','🏟️','🏢','🎪','🎓','🎭','🎨','🏋️','🎤','🎡','🎠','🏖️','🌆','🎯','✦'];
const COLOR_OPTIONS = ['#a855f7','#00d4ff','#00f5a0','#fb923c','#fbbf24','#f43f5e','#60a5fa','#e879f9','#34d399','#f97316'];

// auto-layout: place zones in a simple grid so they don't overlap
function autoLayout(rows: ZoneRow[]): Template['zones'] {
  const COLS = 3;
  const W = 140, H = 60, GAP_X = 20, GAP_Y = 20, START_X = 20, START_Y = 20;
  return rows.map((r, i) => ({
    id: `cz_${r.id}`,
    name: r.name,
    type: r.type,
    maxCapacity: r.maxCapacity,
    x: START_X + (i % COLS) * (W + GAP_X),
    y: START_Y + Math.floor(i / COLS) * (H + GAP_Y),
    width: W,
    height: H,
  }));
}

interface Props {
  onSelect: (template: Template) => void;
}

export default function TemplateSelector({ onSelect }: Props) {
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [creating, setCreating] = useState(false);

  // form state
  const [label, setLabel]       = useState('');
  const [icon, setIcon]         = useState('✦');
  const [color, setColor]       = useState('#00d4ff');
  const [desc, setDesc]         = useState('');
  const [zoneRows, setZoneRows] = useState<ZoneRow[]>([
    { id: '1', name: '', type: 'gate', maxCapacity: 500 },
  ]);
  const [err, setErr] = useState('');

  const addZoneRow = () =>
    setZoneRows(r => [...r, { id: `${Date.now()}`, name: '', type: 'gate', maxCapacity: 500 }]);

  const removeZoneRow = (id: string) =>
    setZoneRows(r => r.filter(z => z.id !== id));

  const updateZoneRow = (id: string, patch: Partial<ZoneRow>) =>
    setZoneRows(r => r.map(z => z.id === id ? { ...z, ...patch } : z));

  const handleSave = () => {
    if (!label.trim()) return setErr('Template name is required.');
    const validRows = zoneRows.filter(r => r.name.trim());
    const newTemplate: Template = {
      id: `custom_${Date.now()}`,
      label: label.trim(),
      icon,
      color,
      description: desc.trim() || `${validRows.length} custom zones`,
      zones: autoLayout(validRows),
    };
    setCustomTemplates(p => [...p, newTemplate]);
    // reset form
    setLabel(''); setIcon('✦'); setColor('#00d4ff'); setDesc('');
    setZoneRows([{ id: '1', name: '', type: 'gate', maxCapacity: 500 }]);
    setErr('');
    setCreating(false);
  };

  const deleteCustom = (id: string) =>
    setCustomTemplates(p => p.filter(t => t.id !== id));

  const allTemplates = [...TEMPLATES, ...customTemplates];

  // ── Creator view ────────────────────────────────────────────────────────────
  if (creating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 space-y-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-bold text-white">Create Custom Template</p>
          <button onClick={() => setCreating(false)}
            className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/70 transition-colors">
            <ChevronLeft size={12} /> Back
          </button>
        </div>

        {/* Name + Icon + Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Template Name *</p>
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Marathon Event"
              className="input-field text-sm w-full" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Description</p>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Short description…"
              className="input-field text-sm w-full" />
          </div>
        </div>

        {/* Icon picker */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">Icon</p>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)}
                className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                style={{
                  background: icon === ic ? `${color}20` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${icon === ic ? color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: icon === ic ? `0 0 10px ${color}40` : 'none',
                }}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">Accent Color</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className="w-7 h-7 rounded-lg transition-all"
                style={{
                  background: c,
                  border: `2px solid ${color === c ? 'white' : 'transparent'}`,
                  boxShadow: color === c ? `0 0 10px ${c}80` : 'none',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }} />
            ))}
            {/* custom hex */}
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
              style={{ background: 'transparent' }}
              title="Custom color" />
          </div>
        </div>

        {/* Zone rows */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Zones</p>
            <button onClick={addZoneRow}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
              style={{ background: `${color}15`, border: `1px solid ${color}35`, color }}>
              <Plus size={10} /> Add Zone
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {zoneRows.map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/20 w-4 flex-shrink-0">{i + 1}</span>

                {/* Name */}
                <input value={row.name} onChange={e => updateZoneRow(row.id, { name: e.target.value })}
                  placeholder="Zone name"
                  className="input-field text-[12px] flex-1 min-w-0 py-1.5" />

                {/* Type */}
                <select value={row.type}
                  onChange={e => updateZoneRow(row.id, { type: e.target.value as ZoneType })}
                  className="input-field text-[11px] py-1.5 flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: 110 }}>
                  {TOOLS.map(t => (
                    <option key={t.type} value={t.type} style={{ background: '#0a1628' }}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>

                {/* Capacity */}
                <input type="number" min={1} value={row.maxCapacity}
                  onChange={e => updateZoneRow(row.id, { maxCapacity: Math.max(1, +e.target.value) })}
                  className="input-field text-[11px] font-mono py-1.5 flex-shrink-0"
                  style={{ width: 80 }}
                  placeholder="Cap" />

                <button onClick={() => removeZoneRow(row.id)}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                  style={{ color: '#f43f5e' }}>
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/20 mt-1.5">Zones are auto-arranged on the canvas — you can reposition them in the builder.</p>
        </div>

        {err && (
          <p className="text-[11px] px-3 py-2 rounded-xl"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
            ⚠ {err}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, color: '#020409', boxShadow: `0 0 20px ${color}40` }}>
            Save Template
          </motion.button>
          <button onClick={() => setCreating(false)}
            className="px-4 py-2.5 rounded-xl text-[12px] text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Grid view ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {allTemplates.map((t, i) => {
          const isCustom = t.id.startsWith('custom_');
          return (
            <motion.div key={t.id} className="relative group"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(t)}
                className="w-full flex flex-col items-start p-4 rounded-2xl text-left transition-all"
                style={{ background: `${t.color}08`, border: `1px solid ${t.color}25` }}>
                <span className="text-3xl mb-3">{t.icon}</span>
                <p className="text-[13px] font-bold text-white mb-1">{t.label}</p>
                <p className="text-[10px] text-white/35 leading-relaxed">{t.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {t.zones.length > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}>
                      {t.zones.length} zones
                    </span>
                  )}
                  {isCustom && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      custom
                    </span>
                  )}
                </div>
              </motion.button>

              {/* Delete button for custom templates */}
              {isCustom && (
                <button
                  onClick={e => { e.stopPropagation(); deleteCustom(t.id); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-lg items-center justify-center hidden group-hover:flex transition-all"
                  style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
                  <Trash2 size={10} />
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Create custom card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: allTemplates.length * 0.04 }}
          whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setCreating(true)}
          className="flex flex-col items-start p-4 rounded-2xl text-left transition-all"
          style={{ background: 'rgba(0,212,255,0.04)', border: '1px dashed rgba(0,212,255,0.25)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Plus size={18} style={{ color: '#00d4ff' }} />
          </div>
          <p className="text-[13px] font-bold text-white mb-1">Create Custom</p>
          <p className="text-[10px] text-white/35 leading-relaxed">Define your own zones, layout and style</p>
        </motion.button>
      </div>
    </div>
  );
}
