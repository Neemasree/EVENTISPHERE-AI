import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../../store/eventStore';
import { riskColor, occupancyColor, formatTime } from '../../utils/helpers';
import type { Zone } from '../../types';
import ZoneDetailModal from './ZoneDetailModal';

const zoneIcons: Record<string, string> = {
  parking: '🚗', gate: '🚪', vip: '⭐', stage: '🎵',
  food: '🍔', medical: '🏥', restroom: '🚻', exit: '↩', emergency_exit: '🚨',
};

interface Props { compact?: boolean }

export default function DigitalTwinVenue({ compact }: Props) {
  const { zones, setSelectedZone, selectedZone } = useEventStore();
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone);
    setShowModal(true);
  };

  // SVG viewBox: 0 0 540 380
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Digital Twin</span>
          <span className="live-dot" />
          <span className="text-xs text-green-400 font-mono">LIVE</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/40">
          {['low','medium','high','critical'].map(r => (
            <span key={r} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: riskColor(r as any) }} />
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="relative" style={{ paddingBottom: compact ? '54%' : '72%' }}>
        <svg
          viewBox="0 0 540 380"
          className="absolute inset-0 w-full h-full"
          style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1425 100%)' }}
        >
          {/* Grid lines */}
          {[...Array(14)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 28} x2="540" y2={i * 28} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[...Array(20)].map((_, i) => (
            <line key={`v${i}`} x1={i * 28} y1="0" x2={i * 28} y2="380" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Venue boundary */}
          <rect x="10" y="10" width="520" height="360" rx="12" fill="none" stroke="rgba(0,212,255,0.15)" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* Zones */}
          {zones.map(zone => {
            const color = riskColor(zone.riskLevel);
            const isHovered = hoveredZone?.id === zone.id;
            const isSelected = selectedZone?.id === zone.id;
            return (
              <g key={zone.id}
                onClick={() => handleZoneClick(zone)}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zone fill */}
                <motion.rect
                  x={zone.x} y={zone.y} width={zone.width} height={zone.height}
                  rx="6"
                  fill={`${color}18`}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
                  animate={{ opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: Math.random() * 2 }}
                />

                {/* Glow on critical */}
                {zone.riskLevel === 'critical' && (
                  <motion.rect
                    x={zone.x - 3} y={zone.y - 3}
                    width={zone.width + 6} height={zone.height + 6}
                    rx="9" fill="none" stroke={color} strokeWidth="1"
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  />
                )}

                {/* Occupancy bar */}
                <rect x={zone.x + 4} y={zone.y + zone.height - 8} width={zone.width - 8} height={4} rx="2" fill="rgba(255,255,255,0.1)" />
                <motion.rect
                  x={zone.x + 4} y={zone.y + zone.height - 8}
                  width={(zone.width - 8) * (zone.occupancy / 100)} height={4} rx="2"
                  fill={occupancyColor(zone.occupancy)}
                  animate={{ width: (zone.width - 8) * (zone.occupancy / 100) }}
                  transition={{ duration: 0.8 }}
                />

                {/* Icon + Name */}
                <text x={zone.x + 8} y={zone.y + 18} fontSize="11" fill={color} fontWeight="600" fontFamily="Inter,sans-serif">
                  {zoneIcons[zone.type]} {zone.name}
                </text>

                {/* Crowd count */}
                <text x={zone.x + 8} y={zone.y + 32} fontSize="9" fill="rgba(255,255,255,0.55)" fontFamily="JetBrains Mono,monospace">
                  {zone.currentCrowd}/{zone.maxCapacity} · {zone.occupancy}%
                </text>
              </g>
            );
          })}

          {/* Tooltip on hover */}
          {hoveredZone && (() => {
            const z = hoveredZone;
            const tx = Math.min(z.x, 380);
            const ty = z.y > 200 ? z.y - 70 : z.y + z.height + 8;
            return (
              <g>
                <rect x={tx} y={ty} width={140} height={60} rx="6"
                  fill="rgba(15,23,42,0.95)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x={tx + 8} y={ty + 16} fontSize="10" fill="white" fontWeight="600" fontFamily="Inter,sans-serif">{z.name}</text>
                <text x={tx + 8} y={ty + 30} fontSize="9" fill={riskColor(z.riskLevel)} fontFamily="Inter,sans-serif">
                  Risk: {z.riskLevel.toUpperCase()}
                </text>
                <text x={tx + 8} y={ty + 44} fontSize="9" fill="rgba(255,255,255,0.6)" fontFamily="Inter,sans-serif">
                  Wait: {z.waitingTime}m · {z.occupancy}% full
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Zone legend chips */}
      <div className="px-4 py-3 border-t border-white/8 flex flex-wrap gap-2">
        {zones.slice(0, compact ? 6 : zones.length).map(zone => (
          <button key={zone.id} onClick={() => handleZoneClick(zone)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all hover:bg-white/10"
            style={{ border: `1px solid ${riskColor(zone.riskLevel)}40`, background: `${riskColor(zone.riskLevel)}10` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskColor(zone.riskLevel) }} />
            <span className="text-white/70">{zone.name}</span>
            <span className="font-mono" style={{ color: riskColor(zone.riskLevel) }}>{zone.occupancy}%</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showModal && selectedZone && (
          <ZoneDetailModal zone={selectedZone} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
