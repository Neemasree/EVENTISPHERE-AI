import { useEffect, useState } from 'react';
import { Trash2, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import { TOOLS } from './BuilderToolbar';

interface Props {
  zone: Zone;
  onChange: (updated: Zone) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;
const PRIORITY_COLORS: Record<string, string> = {
  Low: '#00f5a0', Medium: '#fbbf24', High: '#fb923c', Critical: '#f43f5e',
};

function Section({
  label, children, defaultOpen = true,
}: {
  label: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
          {label}
        </p>
        {open
          ? <ChevronUp size={10} className="text-white/20" />
          : <ChevronDown size={10} className="text-white/20" />}
      </button>
      {open && children}
    </div>
  );
}

export default function ZonePropertiesPanel({ zone, onChange, onDelete, onClose }: Props) {
  const [local, setLocal] = useState<Zone>(zone);
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  // sync when zone selection changes OR when external data updates the zone
  useEffect(() => { setLocal(zone); }, [zone]); // eslint-disable-line

  // single source of truth: always derive from latest local via functional update
  const update = (patch: Partial<Zone>) => {
    setLocal(prev => {
      const next = { ...prev, ...patch };
      onChange(next);
      return next;
    });
  };

  const addCustomProp = () => {
    const k = newKey.trim();
    if (!k) return;
    const v = newVal.trim();
    setNewKey('');
    setNewVal('');
    setLocal(prev => {
      const next = { ...prev, customProps: { ...(prev.customProps ?? {}), [k]: v } };
      onChange(next);
      return next;
    });
  };

  const removeCustomProp = (key: string) => {
    setLocal(prev => {
      const customProps = { ...(prev.customProps ?? {}) };
      delete customProps[key];
      const next = { ...prev, customProps };
      onChange(next);
      return next;
    });
  };

  const editCustomProp = (key: string, val: string) => {
    setLocal(prev => {
      const next = { ...prev, customProps: { ...(prev.customProps ?? {}), [key]: val } };
      onChange(next);
      return next;
    });
  };

  const tool  = TOOLS.find(t => t.type === local.type);
  const color = tool?.color ?? '#ffffff';
  const customEntries = Object.entries(local.customProps ?? {});

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 260,
        flexShrink: 0,
        background: 'rgba(6,12,22,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{tool?.icon ?? '✦'}</span>
          <p className="text-[12px] font-bold text-white">Properties</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">

        {/* ── Identity ── */}
        <Section label="Identity">
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Zone Name</p>
              <input
                value={local.name}
                onChange={e => update({ name: e.target.value })}
                className="input-field text-sm w-full"
                placeholder="e.g. Gate A"
              />
            </div>
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Type</p>
              <select
                value={local.type}
                onChange={e => update({ type: e.target.value as ZoneType })}
                className="input-field text-sm w-full"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                {TOOLS.map(t => (
                  <option key={t.type} value={t.type} style={{ background: '#0a1628' }}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* ── Capacity & Crowd ── */}
        <Section label="Capacity & Crowd">
          <div className="space-y-3">
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Max Capacity</p>
              <input
                type="number" min={1} value={local.maxCapacity}
                onChange={e => {
                  const cap = Math.max(1, +e.target.value);
                  const occ = Math.round((local.currentCrowd / cap) * 100);
                  update({ maxCapacity: cap, occupancy: occ });
                }}
                className="input-field text-sm w-full font-mono"
              />
            </div>
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Current Crowd</p>
              <input
                type="number" min={0} value={local.currentCrowd}
                onChange={e => {
                  const crowd = Math.max(0, Math.min(local.maxCapacity, +e.target.value));
                  const occ   = Math.round((crowd / local.maxCapacity) * 100);
                  update({ currentCrowd: crowd, occupancy: occ });
                }}
                className="input-field text-sm w-full font-mono"
              />
              <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${local.occupancy}%`,
                    background: local.occupancy >= 95 ? '#f43f5e'
                      : local.occupancy >= 80 ? '#fb923c'
                      : local.occupancy >= 60 ? '#fbbf24'
                      : '#00f5a0',
                  }}
                />
              </div>
              <p className="text-[9px] font-mono text-white/30 mt-0.5 text-right">{local.occupancy}% full</p>
            </div>
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Wait Time (min)</p>
              <input
                type="number" min={0} value={local.waitingTime}
                onChange={e => update({ waitingTime: Math.max(0, +e.target.value) })}
                className="input-field text-sm w-full font-mono"
              />
            </div>
          </div>
        </Section>

        {/* ── Risk Level ── */}
        <Section label="Risk Level">
          <div className="grid grid-cols-2 gap-1.5">
            {PRIORITY_OPTIONS.map(p => {
              const c      = PRIORITY_COLORS[p];
              const active = local.riskLevel === p.toLowerCase();
              return (
                <button
                  key={p}
                  onClick={() => update({ riskLevel: p.toLowerCase() as Zone['riskLevel'] })}
                  className="py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? c + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? c : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Notes ── */}
        <Section label="Notes / Recommendation">
          <textarea
            value={local.recommendation ?? ''}
            onChange={e => update({ recommendation: e.target.value })}
            rows={3}
            placeholder="AI recommendation or operator note…"
            className="input-field text-[12px] w-full resize-none"
            style={{ lineHeight: '1.5' }}
          />
        </Section>

        {/* ── AI & Monitoring ── */}
        <Section label="AI & Monitoring" defaultOpen={false}>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}
            >
              <div>
                <p className="text-[11px] font-bold text-white">AI Enabled</p>
                <p className="text-[9px] text-white/30 mt-0.5">Agent monitoring active</p>
              </div>
              <button
                onClick={() => update({ ...local, aiEnabled: !(local as any).aiEnabled } as any)}
                className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
                style={{
                  background: (local as any).aiEnabled
                    ? 'linear-gradient(90deg,#00d4ff,#a855f7)'
                    : 'rgba(255,255,255,0.1)',
                }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: (local as any).aiEnabled ? '22px' : '2px' }}
                />
              </button>
            </div>
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1.5">Monitor Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {['Crowd', 'Queue', 'Wait Time', 'Parking', 'Emergency', 'Sales'].map(m => {
                  const active = (local as any).monitoring?.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        const cur: string[] = (local as any).monitoring ?? [];
                        update({ ...local, monitoring: active ? cur.filter((x: string) => x !== m) : [...cur, m] } as any);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                      style={{
                        background: active ? `${color}15` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                        color: active ? color : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Custom Properties ── */}
        <Section label={`Custom Properties${customEntries.length > 0 ? ` (${customEntries.length})` : ''}`}>
          <div className="space-y-2">

            {/* Existing entries */}
            {customEntries.length === 0 && (
              <p className="text-[10px] text-white/20 py-1">No custom properties yet. Add one below.</p>
            )}
            {customEntries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                {/* Key — read-only pill */}
                <div
                  className="flex-shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold truncate"
                  style={{
                    maxWidth: 90,
                    background: `${color}12`,
                    border: `1px solid ${color}30`,
                    color,
                  }}
                  title={k}
                >
                  {k}
                </div>
                {/* Value — editable */}
                <input
                  value={v}
                  onChange={e => editCustomProp(k, e.target.value)}
                  className="flex-1 min-w-0 input-field text-[11px] font-mono py-1.5"
                  placeholder="value"
                />
                <button
                  onClick={() => removeCustomProp(k)}
                  className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                  style={{ color: '#f43f5e' }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}

            {/* Add row */}
            <div
              className="flex items-center gap-1.5 pt-2"
              style={{ borderTop: customEntries.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
            >
              <input
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomProp(); } }}
                placeholder="key"
                className="flex-1 min-w-0 input-field text-[11px] font-mono py-1.5"
              />
              <input
                value={newVal}
                onChange={e => setNewVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomProp(); } }}
                placeholder="value"
                className="flex-1 min-w-0 input-field text-[11px] font-mono py-1.5"
              />
              <button
                onClick={addCustomProp}
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-all hover:scale-110 active:scale-95"
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}50`,
                  color,
                }}
                title="Add property"
              >
                <Plus size={12} />
              </button>
            </div>
            <p className="text-[9px] text-white/20">Type key + value then press Enter or +</p>
          </div>
        </Section>

        {/* ── Dimensions (read-only) ── */}
        <Section label="Dimensions" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'X',      val: Math.round(local.x)      },
              { label: 'Y',      val: Math.round(local.y)      },
              { label: 'Width',  val: Math.round(local.width)  },
              { label: 'Height', val: Math.round(local.height) },
            ].map(s => (
              <div
                key={s.label}
                className="text-center py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-[9px] text-white/25 uppercase tracking-wider">{s.label}</p>
                <p className="text-[12px] font-mono font-bold text-white/50">{s.val}</p>
              </div>
            ))}
          </div>
        </Section>

      </div>

      {/* Delete */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={() => onDelete(zone.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:bg-red-500/15"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}
        >
          <Trash2 size={13} /> Delete Zone
        </button>
      </div>
    </div>
  );
}
