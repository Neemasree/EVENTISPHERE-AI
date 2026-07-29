import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor, occupancyColor } from '../../utils/helpers';
import type { Zone } from '../../types';
import ZoneDetailModal from './ZoneDetailModal';
import { Layers, ZoomIn } from 'lucide-react';

const zoneIcons: Record<string, string> = {
  parking: '🚗', gate: '🚪', vip: '⭐', stage: '🎵',
  food: '🍔', medical: '🏥', restroom: '🚻', exit: '↩', emergency_exit: '🚨',
};

interface Props { compact?: boolean }

export default function DigitalTwinVenue({ compact }: Props) {
  const { zones, setSelectedZone, selectedZone } = useEventStore();
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [showModal,   setShowModal]   = useState(false);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
    setShowModal(true);
  };

  const criticalCount = zones.filter(z => z.riskLevel === 'critical').length;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <Layers size={13} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white leading-none">Venue Map</p>
            <p className="text-[9px] text-white/30 mt-0.5 font-mono">Click any zone for details</p>
          </div>
          <span className="live-dot w-1.5 h-1.5 ml-1" />
        </div>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: '#f43f5e' }}>
              ⚠ {criticalCount} critical
            </motion.div>
          )}
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2.5">
            {(['low', 'medium', 'high', 'critical'] as const).map(r => (
              <div key={r} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskColor(r), boxShadow: `0 0 4px ${riskColor(r)}` }} />
                <span className="text-[9px] text-white/30 capitalize">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative" style={{ paddingBottom: compact ? '40%' : '44%' }}>
        <svg
          viewBox="0 0 540 380"
          className="absolute inset-0 w-full h-full"
          style={{ background: 'linear-gradient(135deg, #050c1a 0%, #080f20 50%, #050c1a 100%)' }}
        >
          {/* Fine grid */}
          {[...Array(20)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 19} x2="540" y2={i * 19}
              stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          ))}
          {[...Array(28)].map((_, i) => (
            <line key={`v${i}`} x1={i * 19} y1="0" x2={i * 19} y2="380"
              stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          ))}

          {/* Venue boundary */}
          <rect x="8" y="8" width="524" height="364" rx="14"
            fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="1" strokeDasharray="8 5" />
          {/* Inner guide */}
          <rect x="14" y="14" width="512" height="352" rx="10"
            fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

          {/* Zones */}
          {zones.map(zone => {
            const color   = riskColor(zone.riskLevel);
            const isHov   = hoveredZone?.id === zone.id;
            const isSel   = selectedZone?.id === zone.id;
            const isCrit  = zone.riskLevel === 'critical';

            return (
              <g key={zone.id}
                onClick={() => handleZoneClick(zone)}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Critical outer glow ring */}
                {isCrit && (
                  <motion.rect
                    x={zone.x - 4} y={zone.y - 4}
                    width={zone.width + 8} height={zone.height + 8}
                    rx="10" fill="none"
                    stroke={color}
                    strokeWidth="0.8"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}

                {/* Zone background */}
                <motion.rect
                  x={zone.x} y={zone.y}
                  width={zone.width} height={zone.height}
                  rx="7"
                  fill={`${color}${isSel ? '22' : isHov ? '18' : '12'}`}
                  stroke={color}
                  strokeWidth={isSel ? 2 : isHov ? 1.8 : 1.2}
                  animate={{ opacity: isCrit ? [0.8, 1, 0.8] : 1 }}
                  transition={{ duration: 2, repeat: isCrit ? Infinity : 0 }}
                  style={{ filter: isHov || isSel ? `drop-shadow(0 0 6px ${color}60)` : 'none' }}
                />

                {/* Selected indicator */}
                {isSel && (
                  <rect x={zone.x} y={zone.y} width={3} height={zone.height} rx="3"
                    fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                )}

                {/* Zone name & icon */}
                <text x={zone.x + 8} y={zone.y + 17}
                  fontSize="10.5" fill={color}
                  fontWeight="700" fontFamily="Inter,sans-serif">
                  {zoneIcons[zone.type]} {zone.name}
                </text>

                {/* Stats */}
                <text x={zone.x + 8} y={zone.y + 30}
                  fontSize="9" fill="rgba(255,255,255,0.5)"
                  fontFamily="JetBrains Mono,monospace">
                  {zone.currentCrowd}/{zone.maxCapacity}
                </text>

                {/* Occupancy bar track */}
                <rect x={zone.x + 6} y={zone.y + zone.height - 7}
                  width={zone.width - 12} height={3.5} rx="2"
                  fill="rgba(255,255,255,0.08)" />
                {/* Occupancy bar fill */}
                <motion.rect
                  x={zone.x + 6} y={zone.y + zone.height - 7}
                  width={(zone.width - 12) * (zone.occupancy / 100)}
                  height={3.5} rx="2"
                  fill={occupancyColor(zone.occupancy)}
                  animate={{ width: (zone.width - 12) * (zone.occupancy / 100) }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />

                {/* Occupancy % label (for larger zones) */}
                {zone.width >= 100 && (
                  <text
                    x={zone.x + zone.width - 8} y={zone.y + 17}
                    fontSize="9" fill={color}
                    fontFamily="JetBrains Mono,monospace"
                    textAnchor="end" fontWeight="600">
                    {zone.occupancy}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredZone && (() => {
            const z  = hoveredZone;
            const tx = Math.min(Math.max(z.x - 10, 4), 370);
            const ty = z.y > 200 ? z.y - 72 : z.y + z.height + 10;
            const c  = riskColor(z.riskLevel);
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tx} y={ty} width={148} height={64} rx="8"
                  fill="rgba(8,15,32,0.97)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                {/* Accent top */}
                <line x1={tx + 8} y1={ty} x2={tx + 140} y2={ty} stroke={c} strokeWidth="1.5" strokeLinecap="round" />

                <text x={tx + 10} y={ty + 16} fontSize="10.5" fill="white" fontWeight="700" fontFamily="Inter,sans-serif">
                  {z.name}
                </text>
                <text x={tx + 10} y={ty + 30} fontSize="9" fill={c} fontFamily="Inter,sans-serif" fontWeight="600">
                  {z.riskLevel.toUpperCase()} · {z.occupancy}% full
                </text>
                <text x={tx + 10} y={ty + 44} fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="JetBrains Mono,monospace">
                  {z.currentCrowd}/{z.maxCapacity} · Wait: {z.waitingTime}m
                </text>
                <text x={tx + 10} y={ty + 58} fontSize="8.5" fill="rgba(0,212,255,0.7)" fontFamily="Inter,sans-serif">
                  Click for details →
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Zone chips */}
      <div className="px-4 py-2.5 flex flex-wrap gap-1.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {zones.slice(0, compact ? 6 : zones.length).map(zone => {
          const c = riskColor(zone.riskLevel);
          return (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-150 hover:scale-105"
              style={{
                background: `${c}10`,
                border: `1px solid ${c}28`,
                color: 'rgba(255,255,255,0.65)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: c, boxShadow: `0 0 4px ${c}` }} />
              <span>{zone.name}</span>
              <span className="font-mono font-bold" style={{ color: c }}>{zone.occupancy}%</span>
            </button>
          );
        })}
        {compact && zones.length > 6 && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] text-white/30"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <ZoomIn size={10} />
            +{zones.length - 6} more
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && selectedZone && (
          <ZoneDetailModal zone={selectedZone} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
