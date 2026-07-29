import { useEffect, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import { TOOLS } from './BuilderToolbar';

interface Props {
  zone: Zone;
  onChange: (updated: Zone) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const MONITOR_OPTIONS = ['Crowd', 'Queue', 'Wait Time', 'Parking', 'Emergency', 'Sales'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;

export default function ZonePropertiesPanel({ zone, onChange, onDelete, onClose }: Props) {
  const [local, setLocal] = useState(zone);

  useEffect(() => { setLocal(zone); }, [zone.id]);

  const update = (patch: Partial<Zone>) => {
    const updated = { ...local, ...patch };
    setLocal(updated);
    onChange(updated);
  };

  const tool = TOOLS.find(t => t.type === local.type);
  const color = tool?.color ?? '#ffffff';

  return (
    <div className="flex flex-col h-full overflow-y-auto"
      style={{ width: 240, flexShrink: 0, background: 'rgba(6,12,22,0.97)', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className="text-base">{tool?.icon ?? '✦'}</span>
          <p className="text-[12px] font-bold text-white">Properties</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">

        {/* Zone Name */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Zone Name</p>
          <input value={local.name} onChange={e => update({ name: e.target.value })}
            className="input-field text-sm w-full" />
        </div>

        {/* Zone Type */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Type</p>
          <select value={local.type}
            onChange={e => update({ type: e.target.value as ZoneType })}
            className="input-field text-sm w-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
            {TOOLS.map(t => (
              <option key={t.type} value={t.type} style={{ background: '#0a1628' }}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Capacity</p>
          <input type="number" value={local.maxCapacity}
            onChange={e => update({ maxCapacity: +e.target.value })}
            className="input-field text-sm w-full font-mono" />
        </div>

        {/* Priority */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Priority</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRIORITY_OPTIONS.map(p => {
              const colors: Record<string, string> = { Low: '#00f5a0', Medium: '#fbbf24', High: '#fb923c', Critical: '#f43f5e' };
              const c = colors[p];
              const active = local.riskLevel === p.toLowerCase();
              return (
                <button key={p} onClick={() => update({ riskLevel: p.toLowerCase() as Zone['riskLevel'] })}
                  className="py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  style={{
                    background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? c + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? c : 'rgba(255,255,255,0.3)',
                  }}>{p}</button>
              );
            })}
          </div>
        </div>

        {/* Monitoring */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Monitor</p>
          <div className="flex flex-wrap gap-1.5">
            {MONITOR_OPTIONS.map(m => {
              const active = (local as any).monitoring?.includes(m);
              return (
                <button key={m}
                  onClick={() => {
                    const cur: string[] = (local as any).monitoring ?? [];
                    const next = active ? cur.filter(x => x !== m) : [...cur, m];
                    update({ ...local, monitoring: next } as any);
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                  style={{
                    background: active ? `${color}15` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? color : 'rgba(255,255,255,0.3)',
                  }}>{m}</button>
              );
            })}
          </div>
        </div>

        {/* AI Enabled */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <div>
            <p className="text-[11px] font-bold text-white">AI Enabled</p>
            <p className="text-[9px] text-white/30 mt-0.5">Agent monitoring active</p>
          </div>
          <button
            onClick={() => update({ ...local, aiEnabled: !(local as any).aiEnabled } as any)}
            className="w-10 h-5 rounded-full transition-all relative flex-shrink-0"
            style={{
              background: (local as any).aiEnabled ? 'linear-gradient(90deg,#00d4ff,#a855f7)' : 'rgba(255,255,255,0.1)',
            }}>
            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: (local as any).aiEnabled ? '22px' : '2px' }} />
          </button>
        </div>

        {/* Size info */}
        <div className="grid grid-cols-2 gap-2">
          {[{ label: 'Width', val: Math.round(local.width) }, { label: 'Height', val: Math.round(local.height) }].map(s => (
            <div key={s.label} className="text-center py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] text-white/25 uppercase tracking-wider">{s.label}</p>
              <p className="text-[13px] font-mono font-bold text-white/60">{s.val}px</p>
            </div>
          ))}
        </div>
      </div>

      {/* Delete */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => onDelete(zone.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:bg-red-500/15"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
          <Trash2 size={13} /> Delete Zone
        </button>
      </div>
    </div>
  );
}
