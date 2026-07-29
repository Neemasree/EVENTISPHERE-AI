import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Save, RotateCcw, Eye, Pencil } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import BuilderToolbar, { TOOLS, type ToolItem } from './BuilderToolbar';
import ZonePropertiesPanel from './ZonePropertiesPanel';
import AIVenueValidator from './AIVenueValidator';
import { riskColor } from '../../utils/helpers';

const GRID = 20;
const CANVAS_W = 540;
const CANVAS_H = 380;

const snap = (v: number) => Math.round(v / GRID) * GRID;

function makeZone(tool: ToolItem, x: number, y: number, idx: number): Zone {
  return {
    id: `z_${Date.now()}_${idx}`,
    name: `${tool.label} ${idx + 1}`,
    type: tool.type === 'custom' ? 'gate' as ZoneType : tool.type as ZoneType,
    x: snap(x), y: snap(y),
    width: tool.defaultW, height: tool.defaultH,
    maxCapacity: 500,
    currentCrowd: 0,
    occupancy: 0,
    waitingTime: 0,
    riskLevel: 'low',
  };
}

const zoneIcons: Record<string, string> = {
  parking: '🚗', gate: '🚪', vip: '⭐', stage: '🎵',
  food: '🍔', medical: '🏥', restroom: '🚻', exit: '↩', emergency_exit: '🚨', custom: '✦',
};

interface Props {
  initialZones: Zone[];
  onSave: (zones: Zone[]) => void;
}

export default function DigitalTwinBuilder({ initialZones, onSave }: Props) {
  const [zones, setZones]           = useState<Zone[]>(initialZones);
  const [selected, setSelected]     = useState<string | null>(null);
  const [mode, setMode]             = useState<'design' | 'monitor'>('design');
  const [showValidator, setShowValidator] = useState(false);
  const [saved, setSaved]           = useState(false);

  const svgRef        = useRef<SVGSVGElement>(null);
  const dragToolRef   = useRef<ToolItem | null>(null);
  const dragZoneRef   = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef     = useRef<{ id: string; edge: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const zoneCountRef  = useRef(initialZones.length);

  const selectedZone = zones.find(z => z.id === selected) ?? null;

  // ── SVG coordinate helper ──────────────────────────────────────────────────
  const svgCoords = (e: React.DragEvent | React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  // ── Drop new zone from toolbar ─────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const tool = dragToolRef.current;
    if (!tool) return;
    const { x, y } = svgCoords(e);
    const newZone = makeZone(tool, x - tool.defaultW / 2, y - tool.defaultH / 2, zoneCountRef.current++);
    setZones(prev => [...prev, newZone]);
    setSelected(newZone.id);
    dragToolRef.current = null;
  }, []);

  // ── Drag existing zone ─────────────────────────────────────────────────────
  const startZoneDrag = (e: React.MouseEvent, id: string) => {
    if (mode !== 'design') return;
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const zone = zones.find(z => z.id === id)!;
    dragZoneRef.current = { id, startX: x, startY: y, origX: zone.x, origY: zone.y };
    setSelected(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragZoneRef.current) {
      const { id, startX, startY, origX, origY } = dragZoneRef.current;
      const { x, y } = svgCoords(e);
      const nx = snap(Math.max(0, origX + (x - startX)));
      const ny = snap(Math.max(0, origY + (y - startY)));
      setZones(prev => prev.map(z => z.id === id ? { ...z, x: nx, y: ny } : z));
    }
    if (resizeRef.current) {
      const { id, edge, startX, startY, origW, origH, origX, origY } = resizeRef.current;
      const { x, y } = svgCoords(e);
      const dx = x - startX, dy = y - startY;
      setZones(prev => prev.map(z => {
        if (z.id !== id) return z;
        let { width: w, height: h, x: zx, y: zy } = z;
        if (edge.includes('e')) w = snap(Math.max(GRID * 3, origW + dx));
        if (edge.includes('s')) h = snap(Math.max(GRID * 2, origH + dy));
        if (edge.includes('w')) { const nw = snap(Math.max(GRID * 3, origW - dx)); zx = snap(origX + (origW - nw)); w = nw; }
        if (edge.includes('n')) { const nh = snap(Math.max(GRID * 2, origH - dy)); zy = snap(origY + (origH - nh)); h = nh; }
        return { ...z, x: zx, y: zy, width: w, height: h };
      }));
    }
  };

  const handleMouseUp = () => {
    dragZoneRef.current = null;
    resizeRef.current   = null;
  };

  const startResize = (e: React.MouseEvent, id: string, edge: string) => {
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const zone = zones.find(z => z.id === id)!;
    resizeRef.current = { id, edge, startX: x, startY: y, origW: zone.width, origH: zone.height, origX: zone.x, origY: zone.y };
  };

  const handleSave = () => {
    onSave(zones);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tool = (z: Zone) => TOOLS.find(t => t.type === z.type);
  const color = (z: Zone) => tool(z)?.color ?? '#ffffff';

  return (
    <div className="flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
        style={{ background: 'rgba(6,12,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['design', 'monitor'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize"
                style={mode === m ? { background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }
                  : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
                {m === 'design' ? <Pencil size={11} /> : <Eye size={11} />}
                {m}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-white/25 font-mono">{zones.length} zones</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZones(initialZones)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RotateCcw size={11} /> Reset
          </button>
          <button onClick={() => setShowValidator(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
            <Shield size={11} /> Validate
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-bold"
            style={saved
              ? { background: 'rgba(0,245,160,0.15)', border: '1px solid rgba(0,245,160,0.3)', color: '#00f5a0' }
              : { background: 'linear-gradient(135deg,#00d4ff,#0088cc)', color: '#020409', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}>
            <Save size={11} /> {saved ? 'Saved!' : 'Save Twin'}
          </motion.button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Toolbar — design mode only */}
        {mode === 'design' && (
          <BuilderToolbar onDragStart={tool => { dragToolRef.current = tool; }} />
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto relative"
          style={{ background: '#020810' }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            className="w-full h-full"
            style={{ minHeight: 400, cursor: mode === 'design' ? 'crosshair' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelected(null)}>

            {/* Grid */}
            <defs>
              <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Boundary */}
            <rect x="4" y="4" width={CANVAS_W - 8} height={CANVAS_H - 8} rx="8"
              fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="1" strokeDasharray="8 5" />

            {/* Zones */}
            {zones.map(z => {
              const c   = mode === 'monitor' ? riskColor(z.riskLevel) : color(z);
              const sel = selected === z.id;
              const occ = z.occupancy;

              return (
                <g key={z.id}
                  onMouseDown={e => startZoneDrag(e, z.id)}
                  onClick={e => { e.stopPropagation(); setSelected(z.id); }}
                  style={{ cursor: mode === 'design' ? 'move' : 'pointer' }}>

                  {/* Selection glow */}
                  {sel && (
                    <rect x={z.x - 3} y={z.y - 3} width={z.width + 6} height={z.height + 6} rx="10"
                      fill="none" stroke={c} strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                  )}

                  {/* Zone body */}
                  <rect x={z.x} y={z.y} width={z.width} height={z.height} rx="6"
                    fill={`${c}${sel ? '22' : '12'}`}
                    stroke={c} strokeWidth={sel ? 2 : 1.2}
                    style={{ filter: sel ? `drop-shadow(0 0 8px ${c}60)` : 'none' }} />

                  {/* Icon + name */}
                  <text x={z.x + 8} y={z.y + 16} fontSize="10" fill={c}
                    fontWeight="700" fontFamily="Inter,sans-serif">
                    {zoneIcons[z.type] ?? '✦'} {z.name}
                  </text>

                  {/* Capacity */}
                  <text x={z.x + 8} y={z.y + 28} fontSize="8.5" fill="rgba(255,255,255,0.4)"
                    fontFamily="JetBrains Mono,monospace">
                    cap: {z.maxCapacity.toLocaleString()}
                  </text>

                  {/* Monitor mode — occupancy bar */}
                  {mode === 'monitor' && (
                    <>
                      <rect x={z.x + 6} y={z.y + z.height - 7} width={z.width - 12} height={3} rx="2"
                        fill="rgba(255,255,255,0.08)" />
                      <rect x={z.x + 6} y={z.y + z.height - 7}
                        width={(z.width - 12) * (occ / 100)} height={3} rx="2" fill={c} />
                      <text x={z.x + z.width - 6} y={z.y + 16} fontSize="8.5" fill={c}
                        textAnchor="end" fontFamily="JetBrains Mono,monospace" fontWeight="600">
                        {occ}%
                      </text>
                    </>
                  )}

                  {/* Resize handles — design mode only */}
                  {sel && mode === 'design' && (
                    <>
                      {[
                        { edge: 'se', cx: z.x + z.width, cy: z.y + z.height },
                        { edge: 'sw', cx: z.x,           cy: z.y + z.height },
                        { edge: 'ne', cx: z.x + z.width, cy: z.y            },
                        { edge: 'nw', cx: z.x,           cy: z.y            },
                      ].map(h => (
                        <rect key={h.edge}
                          x={h.cx - 5} y={h.cy - 5} width={10} height={10} rx="2"
                          fill={c} stroke="white" strokeWidth="1"
                          style={{ cursor: `${h.edge}-resize` }}
                          onMouseDown={e => { e.stopPropagation(); startResize(e, z.id, h.edge); }} />
                      ))}
                    </>
                  )}
                </g>
              );
            })}

            {/* Empty state */}
            {zones.length === 0 && (
              <g>
                <text x={CANVAS_W / 2} y={CANVAS_H / 2 - 16} textAnchor="middle"
                  fontSize="28" fill="rgba(255,255,255,0.08)">🏟️</text>
                <text x={CANVAS_W / 2} y={CANVAS_H / 2 + 12} textAnchor="middle"
                  fontSize="12" fill="rgba(255,255,255,0.15)" fontFamily="Inter,sans-serif">
                  Drag zones from the left panel
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Properties panel */}
        <AnimatePresence>
          {selectedZone && mode === 'design' && (
            <motion.div initial={{ x: 240, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 240, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="h-full overflow-hidden flex-shrink-0">
              <ZonePropertiesPanel
                zone={selectedZone}
                onChange={updated => setZones(prev => prev.map(z => z.id === updated.id ? updated : z))}
                onDelete={id => { setZones(prev => prev.filter(z => z.id !== id)); setSelected(null); }}
                onClose={() => setSelected(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Validator modal */}
      <AnimatePresence>
        {showValidator && <AIVenueValidator zones={zones} onClose={() => setShowValidator(false)} />}
      </AnimatePresence>
    </div>
  );
}
