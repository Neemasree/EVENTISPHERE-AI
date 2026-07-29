import type { ZoneType } from '../../types';

export interface ToolItem {
  type: ZoneType | 'custom';
  label: string;
  icon: string;
  color: string;
  defaultW: number;
  defaultH: number;
}

export const TOOLS: ToolItem[] = [
  { type: 'gate',           label: 'Gate',          icon: '🚪', color: '#00f5a0', defaultW: 80,  defaultH: 50  },
  { type: 'parking',        label: 'Parking',       icon: '🚗', color: '#fbbf24', defaultW: 120, defaultH: 60  },
  { type: 'stage',          label: 'Stage',         icon: '🎵', color: '#a855f7', defaultW: 200, defaultH: 120 },
  { type: 'food',           label: 'Food Court',    icon: '🍔', color: '#fb923c', defaultW: 110, defaultH: 70  },
  { type: 'medical',        label: 'Medical',       icon: '🏥', color: '#f43f5e', defaultW: 80,  defaultH: 50  },
  { type: 'vip',            label: 'VIP',           icon: '⭐', color: '#00d4ff', defaultW: 100, defaultH: 60  },
  { type: 'restroom',       label: 'Washroom',      icon: '🚻', color: '#60a5fa', defaultW: 70,  defaultH: 45  },
  { type: 'exit',           label: 'Exit',          icon: '↩',  color: '#00f5a0', defaultW: 90,  defaultH: 45  },
  { type: 'emergency_exit', label: 'Emergency Exit',icon: '🚨', color: '#f43f5e', defaultW: 80,  defaultH: 45  },
  { type: 'custom',         label: 'Custom Zone',   icon: '✦',  color: '#ffffff', defaultW: 100, defaultH: 60  },
];

interface Props { onDragStart: (tool: ToolItem) => void }

export default function BuilderToolbar({ onDragStart }: Props) {
  return (
    <div className="flex flex-col h-full select-none"
      style={{ background: 'rgba(6,12,22,0.97)', borderRight: '1px solid rgba(255,255,255,0.07)', width: 160, flexShrink: 0 }}>
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Components</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {TOOLS.map(tool => (
          <div key={tool.type} draggable onDragStart={() => onDragStart(tool)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] active:opacity-60"
            style={{ background: `${tool.color}10`, border: `1px solid ${tool.color}25` }}>
            <span className="text-sm leading-none">{tool.icon}</span>
            <span className="text-[11px] font-semibold leading-tight" style={{ color: tool.color }}>{tool.label}</span>
          </div>
        ))}
      </div>
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[9px] text-white/20 text-center">Drag onto canvas</p>
      </div>
    </div>
  );
}
