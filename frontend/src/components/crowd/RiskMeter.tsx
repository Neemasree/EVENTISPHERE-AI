import { motion } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import type { RiskLevel } from '../../types';
import { ShieldAlert } from 'lucide-react';

const levels: { id: RiskLevel; label: string; color: string; angle: number }[] = [
  { id: 'low',      label: 'LOW',      color: '#00f5a0', angle: -90 },
  { id: 'medium',   label: 'MED',      color: '#fbbf24', angle: -30 },
  { id: 'high',     label: 'HIGH',     color: '#fb923c', angle: 30  },
  { id: 'critical', label: 'CRIT',     color: '#f43f5e', angle: 90  },
];

const riskToAngle: Record<RiskLevel, number> = { low: -90, medium: -30, high: 30, critical: 90 };

const segmentData = [
  { start: -90, end: -30, color: '#00f5a0' },
  { start: -30, end:  30, color: '#fbbf24' },
  { start:  30, end:  90, color: '#fb923c' },
];

export default function RiskMeter() {
  const risk         = useEventStore(s => s.kpi.riskLevel);
  const zones        = useEventStore(s => s.zones);
  const needleAngle  = riskToAngle[risk];
  const currentLevel = levels.find(l => l.id === risk)!;

  const cx = 110, cy = 90, r = 72;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;

  const arc = (start: number, end: number, radius: number) => {
    const s = toRad(start), e = toRad(end);
    return `M ${cx + radius * Math.cos(s)} ${cy + radius * Math.sin(s)}
            A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos(e)} ${cy + radius * Math.sin(e)}`;
  };

  const needleRad = toRad(needleAngle);
  const nx = cx + (r - 16) * Math.cos(needleRad);
  const ny = cy + (r - 16) * Math.sin(needleRad);

  const criticalZones  = zones.filter(z => z.riskLevel === 'critical').length;
  const highZones      = zones.filter(z => z.riskLevel === 'high').length;
  const avgOccupancy   = Math.round(zones.reduce((s, z) => s + z.occupancy, 0) / zones.length);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${risk === 'critical' ? 'rgba(244,63,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: risk === 'critical'
          ? '0 0 30px rgba(244,63,94,0.12), 0 4px 24px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.35)',
        animation: risk === 'critical' ? 'criticalPulse 2s ease-in-out infinite' : undefined,
      }}>

      <div className="p-5">
        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${currentLevel.color}15`, border: `1px solid ${currentLevel.color}30` }}>
            <ShieldAlert size={14} style={{ color: currentLevel.color }} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Overall Risk</p>
        </div>

        {/* Gauge */}
        <div className="flex flex-col items-center">
          <svg viewBox="20 30 180 110" className="w-full max-w-[240px] select-none">
            {/* Background track segments */}
            {segmentData.map((seg, i) => (
              <path key={i} d={arc(seg.start, seg.end, r)}
                stroke={`${seg.color}20`} fill="none" strokeWidth="10" strokeLinecap="round" />
            ))}
            {/* Critical segment bg */}
            <path d={arc(30, 90, r)} stroke="rgba(244,63,94,0.15)" fill="none" strokeWidth="10" strokeLinecap="round" />

            {/* Active filled arc */}
            <path
              d={arc(-90, needleAngle, r)}
              stroke={currentLevel.color}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 8px ${currentLevel.color}90)`,
                transition: 'stroke 0.5s ease',
              }}
            />

            {/* Outer decorative ring */}
            <path d={arc(-90, 90, r + 14)}
              stroke="rgba(255,255,255,0.05)" fill="none" strokeWidth="1" strokeLinecap="round" />

            {/* Tick marks */}
            {[-90, -60, -30, 0, 30, 60, 90].map(angle => {
              const rad = toRad(angle);
              const isMajor = angle % 30 === 0;
              const inner = isMajor ? r - 12 : r - 9;
              const outer = isMajor ? r - 5  : r - 5;
              return (
                <line key={angle}
                  x1={cx + inner * Math.cos(rad)} y1={cy + inner * Math.sin(rad)}
                  x2={cx + outer * Math.cos(rad)} y2={cy + outer * Math.sin(rad)}
                  stroke={`rgba(255,255,255,${isMajor ? 0.25 : 0.1})`}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
              );
            })}

            {/* Needle shadow */}
            <line x1={cx} y1={cy} x2={nx + 2} y2={ny + 2}
              stroke="rgba(0,0,0,0.4)" strokeWidth="3" strokeLinecap="round"
              style={{ transition: 'x2 0.8s ease, y2 0.8s ease' }} />
            {/* Needle */}
            <line x1={cx} y1={cy} x2={nx} y2={ny}
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              style={{ transition: 'x2 0.8s ease, y2 0.8s ease', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.6))' }} />

            {/* Needle hub */}
            <circle cx={cx} cy={cy} r="6" fill="white"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
            <circle cx={cx} cy={cy} r="3" style={{ fill: currentLevel.color }} />

            {/* Level labels */}
            {levels.map(l => {
              const rad = toRad(l.angle);
              const lx  = cx + (r + 20) * Math.cos(rad);
              const ly  = cy + (r + 20) * Math.sin(rad);
              return (
                <text key={l.id} x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" fontWeight="700"
                  fill={l.id === risk ? l.color : `${l.color}60`}
                  fontFamily="Inter,sans-serif"
                  style={{ transition: 'fill 0.4s ease' }}>
                  {l.label}
                </text>
              );
            })}
          </svg>

          {/* Current level label */}
          <div className="text-center -mt-1 mb-4">
            <motion.p
              key={risk}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-bold tracking-tight font-display"
              style={{ color: currentLevel.color, textShadow: `0 0 24px ${currentLevel.color}80` }}
            >
              {currentLevel.label}
            </motion.p>
            <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">Overall Risk Level</p>
          </div>

          {/* Stats row */}
          <div className="w-full grid grid-cols-3 gap-2">
            {[
              { label: 'Critical', value: criticalZones, color: '#f43f5e' },
              { label: 'High',     value: highZones,     color: '#fb923c' },
              { label: 'Avg Occ.', value: `${avgOccupancy}%`, color: '#00d4ff' },
            ].map(s => (
              <div key={s.label} className="text-center py-2 rounded-xl"
                style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
