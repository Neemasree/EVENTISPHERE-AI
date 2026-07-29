import { useEventStore } from '../../store/eventStore';
import type { RiskLevel } from '../../types';

const levels: { id: RiskLevel; label: string; color: string; angle: number }[] = [
  { id: 'low',      label: 'LOW',      color: '#00ff88', angle: -90 },
  { id: 'medium',   label: 'MEDIUM',   color: '#fbbf24', angle: -30 },
  { id: 'high',     label: 'HIGH',     color: '#f97316', angle: 30  },
  { id: 'critical', label: 'CRITICAL', color: '#ef4444', angle: 90  },
];

const riskToAngle: Record<RiskLevel, number> = { low: -90, medium: -30, high: 30, critical: 90 };

export default function RiskMeter() {
  const risk = useEventStore(s => s.kpi.riskLevel);
  const needleAngle = riskToAngle[risk];
  const currentLevel = levels.find(l => l.id === risk)!;

  const cx = 100, cy = 90, r = 70;
  const toRad = (deg: number) => (deg - 90) * Math.PI / 180;

  const arcPath = (start: number, end: number) => {
    const s = toRad(start), e = toRad(end);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  // Compute needle tip once — used for both initial render and CSS transition
  const needleRad = toRad(needleAngle);
  const needleX2 = cx + (r - 20) * Math.cos(needleRad);
  const needleY2 = cy + (r - 20) * Math.sin(needleRad);
  const activePath = arcPath(-90, needleAngle);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Overall Risk Level</p>
      <div className="flex flex-col items-center">
        <svg viewBox="0 50 200 100" className="w-48">
          {/* Background arcs */}
          <path d={arcPath(-90, -30)} stroke="rgba(0,255,136,0.25)"  fill="none" strokeWidth="10" strokeLinecap="round" />
          <path d={arcPath(-30,  30)} stroke="rgba(251,191,36,0.25)" fill="none" strokeWidth="10" strokeLinecap="round" />
          <path d={arcPath( 30,  90)} stroke="rgba(249,115,22,0.25)" fill="none" strokeWidth="10" strokeLinecap="round" />

          {/* Active arc — plain SVG path with CSS transition, no motion.path */}
          <path
            d={activePath}
            stroke={currentLevel.color}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${currentLevel.color})`,
              transition: 'stroke 0.4s ease',
            }}
          />

          {/* Tick marks */}
          {[-90, -60, -30, 0, 30, 60, 90].map(angle => {
            const rad = toRad(angle);
            const x1 = cx + (r - 14) * Math.cos(rad);
            const y1 = cy + (r - 14) * Math.sin(rad);
            const x2 = cx + (r - 6)  * Math.cos(rad);
            const y2 = cy + (r - 6)  * Math.sin(rad);
            return (
              <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            );
          })}

          {/* Needle — plain SVG line with CSS transition */}
          <line
            x1={cx} y1={cy}
            x2={needleX2} y2={needleY2}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'x2 0.8s ease, y2 0.8s ease' }}
          />
          <circle cx={cx} cy={cy} r="5" fill="white" />

          {/* Labels */}
          {levels.map(l => {
            const rad = toRad(l.angle);
            const lx = cx + (r + 14) * Math.cos(rad);
            const ly = cy + (r + 14) * Math.sin(rad);
            return (
              <text key={l.id} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fontWeight="600" fill={l.color} fontFamily="Inter,sans-serif">
                {l.label}
              </text>
            );
          })}
        </svg>

        <div className="text-center -mt-2"
          style={{ transition: 'color 0.4s ease' }}>
          <p className="text-2xl font-bold transition-all duration-500"
            style={{ color: currentLevel.color, textShadow: `0 0 20px ${currentLevel.color}` }}>
            {currentLevel.label}
          </p>
          <p className="text-xs text-white/40 mt-1">Overall Risk Assessment</p>
        </div>
      </div>
    </div>
  );
}
