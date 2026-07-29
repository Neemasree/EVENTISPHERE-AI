import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Save, RotateCcw, Eye, Pencil, ZoomIn, ZoomOut, Grid, Copy, Undo2, Redo2 } from 'lucide-react';
import type { Zone, ZoneType } from '../../types';
import BuilderToolbar, { TOOLS, type ToolItem } from './BuilderToolbar';
import ZonePropertiesPanel from './ZonePropertiesPanel';
import AIVenueValidator from './AIVenueValidator';
import { riskColor } from '../../utils/helpers';

const GRID = 20;
const CANVAS_W = 540;
const CANVAS_H = 380;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

const snap = (v: number) => Math.round(v / GRID) * GRID;

function makeZone(tool: ToolItem, x: number, y: number, idx: number): Zone {
  return {
    id: `z_${Date.now()}_${idx}`,
    name: `${tool.label} ${idx + 1}`,
    type: tool.type === 'custom' ? 'gate' as ZoneType : tool.type as ZoneType,
    x: snap(x), y: snap(y),
    width: tool.defaultW, height: tool.defaultH,
    maxCapacity: 500, currentCrowd: 0, occupancy: 0, waitingTime: 0, riskLevel: 'low',
  };
}

const zoneIcons: Record<string, string> = {
  parking: '🚗', gate: '🚪', vip: '⭐', stage: '🎵',
  food: '🍔', medical: '🏥', restroom: '🚻', exit: '↩', emergency_exit: '🚨', custom: '✦',
};

interface Props { initialZones: Zone[]; onSave: (zones: Zone[]) => void }

export default function DigitalTwinBuilder({ initialZones, onSave }: Props) {
  const [zones, setZones]           = useState<Zone[]>(initialZones);
  const [history, setHistory]       = useState<Zone[][]>([initialZones]);
  const [histIdx, setHistIdx]       = useState(0);
  const [selected, setSelected]     = useState<string | null>(null);
  const [mode, setMode]             = useState<'design' | 'monitor'>('design');
  const [showValidator, setShowValidator] = useState(false);
  const [saved, setSaved]           = useState(false);
  const [zoom, setZoom]             = useState(1);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid]     = useState(true);
  const [guides, setGuides]         = useState<{ x?: number; y?: number }>({});

  const svgRef       = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragToolRef  = useRef<ToolItem | null>(null);
  const dragZoneRef  = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef    = useRef<{ id: string; edge: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const panRef       = useRef<{ startX: number; startY: number; origPan: { x: number; y: number } } | null>(null);
  const zoneCountRef = useRef(initialZones.length);

  const selectedZone = zones.find(z => z.id === selected) ?? null;

  // ── History helpers ────────────────────────────────────────────────────────
  const pushHistory = useCallback((newZones: Zone[]) => {
    setHistory(h => {
      const trimmed = h.slice(0, histIdx + 1);
      return [...trimmed, newZones].slice(-30);
    });
    setHistIdx(i => Math.min(i + 1, 29));
  }, [histIdx]);

  const undo = useCallback(() => {
    if (histIdx <= 0) return;
    const prev = history[histIdx - 1];
    setZones(prev); setHistIdx(i => i - 1); setSelected(null);
  }, [history, histIdx]);

  const redo = useCallback(() => {
    if (histIdx >= history.length - 1) return;
    const next = history[histIdx + 1];
    setZones(next); setHistIdx(i => i + 1); setSelected(null);
  }, [history, histIdx]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (ctrl && e.key === 'd' && selected) { e.preventDefault(); duplicateZone(selected); }
      if (e.key === 'Delete' && selected) { deleteZone(selected); }
      if (ctrl && e.key === '=') { e.preventDefault(); setZoom(z => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(1))); }
      if (ctrl && e.key === '-') { e.preventDefault(); setZoom(z => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(1))); }
      if (ctrl && e.key === '0') { e.preventDefault(); setZoom(1); setPan({ x: 0, y: 0 }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, undo, redo]);

  // ── SVG coordinate helper (accounts for zoom + pan) ───────────────────────
  const svgCoords = (e: React.DragEvent | React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    // Direct mapping from screen coords to SVG viewBox coords
    return {
      x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
    };
  };

  // ── Alignment guides ───────────────────────────────────────────────────────
  const computeGuides = (movingId: string, nx: number, ny: number) => {
    const others = zones.filter(z => z.id !== movingId);
    const g: { x?: number; y?: number } = {};
    for (const o of others) {
      if (Math.abs(o.x - nx) < 6) g.x = o.x;
      if (Math.abs(o.y - ny) < 6) g.y = o.y;
      if (Math.abs((o.x + o.width) - nx) < 6) g.x = o.x + o.width;
      if (Math.abs((o.y + o.height) - ny) < 6) g.y = o.y + o.height;
    }
    setGuides(g);
  };

  // ── Drop new zone from toolbar ─────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const tool = dragToolRef.current;
    if (!tool) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (e.clientY - rect.top)  * (CANVAS_H / rect.height);
    const newZone = makeZone(tool, x - tool.defaultW / 2, y - tool.defaultH / 2, zoneCountRef.current++);
    newZone.x = Math.max(0, Math.min(CANVAS_W - newZone.width,  newZone.x));
    newZone.y = Math.max(0, Math.min(CANVAS_H - newZone.height, newZone.y));
    const next = [...zones, newZone];
    setZones(next); pushHistory(next); setSelected(newZone.id);
    dragToolRef.current = null;
  }, [zones, pushHistory]);

  // ── Drag existing zone ─────────────────────────────────────────────────────
  const startZoneDrag = (e: React.MouseEvent, id: string) => {
    if (mode !== 'design') return;
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const zone = zones.find(z => z.id === id)!;
    dragZoneRef.current = { id, startX: x, startY: y, origX: zone.x, origY: zone.y };
    setSelected(id);
  };

  // ── Pan canvas (middle mouse or space+drag) ────────────────────────────────
  const startPan = (e: React.MouseEvent) => {
    if (e.button !== 1 && !e.altKey) return;
    e.preventDefault();
    panRef.current = { startX: e.clientX, startY: e.clientY, origPan: { ...pan } };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (panRef.current) {
      const { startX, startY, origPan } = panRef.current;
      setPan({ x: origPan.x + (e.clientX - startX), y: origPan.y + (e.clientY - startY) });
      return;
    }
    if (dragZoneRef.current) {
      const { id, startX, startY, origX, origY } = dragZoneRef.current;
      const { x, y } = svgCoords(e);
      const nx = snap(Math.max(0, origX + (x - startX)));
      const ny = snap(Math.max(0, origY + (y - startY)));
      computeGuides(id, nx, ny);
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
    if (dragZoneRef.current) { pushHistory(zones); setGuides({}); }
    if (resizeRef.current)   { pushHistory(zones); }
    dragZoneRef.current = null;
    resizeRef.current   = null;
    panRef.current      = null;
  };

  const startResize = (e: React.MouseEvent, id: string, edge: string) => {
    e.stopPropagation();
    const { x, y } = svgCoords(e);
    const zone = zones.find(z => z.id === id)!;
    resizeRef.current = { id, edge, startX: x, startY: y, origW: zone.width, origH: zone.height, origX: zone.x, origY: zone.y };
  };

  // ── Wheel zoom ─────────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z - e.deltaY * 0.001).toFixed(2))));
  };

  // ── Duplicate ──────────────────────────────────────────────────────────────
  const duplicateZone = (id: string) => {
    const z = zones.find(z => z.id === id);
    if (!z) return;
    const copy: Zone = { ...z, id: `z_${Date.now()}`, x: z.x + GRID * 2, y: z.y + GRID * 2, name: `${z.name} (copy)` };
    const next = [...zones, copy];
    setZones(next); pushHistory(next); setSelected(copy.id);
  };

  const deleteZone = (id: string) => {
    const next = zones.filter(z => z.id !== id);
    setZones(next); pushHistory(next); setSelected(null);
  };

  const handleSave = () => {
    onSave(zones); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tool = (z: Zone) => TOOLS.find(t => t.type === z.type);
  const color = (z: Zone) => tool(z)?.color ?? '#ffffff';

  return (
    <div className="flex flex-col h-full">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0 gap-2"
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

        {/* Centre controls */}
        <div className="flex items-center gap-1">
          {/* Undo/Redo */}
          <button onClick={undo} disabled={histIdx <= 0} title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Undo2 size={12} />
          </button>
          <button onClick={redo} disabled={histIdx >= history.length - 1} title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Redo2 size={12} />
          </button>

          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Duplicate */}
          <button onClick={() => selected && duplicateZone(selected)} disabled={!selected} title="Duplicate (Ctrl+D)"
            className="p-1.5 rounded-lg transition-colors disabled:opacity-20"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Copy size={12} />
          </button>

          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Grid toggle */}
          <button onClick={() => setShowGrid(g => !g)} title="Toggle grid"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: showGrid ? '#00d4ff' : 'rgba(255,255,255,0.3)', background: showGrid ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showGrid ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
            <Grid size={12} />
          </button>

          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Zoom controls */}
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(1)))} title="Zoom out (Ctrl+-)"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ZoomOut size={12} />
          </button>
          <span className="text-[10px] font-mono text-white/40 w-9 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(1)))} title="Zoom in (Ctrl+=)"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ZoomIn size={12} />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset view (Ctrl+0)"
            className="px-2 py-1 rounded-lg text-[9px] font-mono transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            1:1
          </button>
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
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSave}
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
          <BuilderToolbar onDragStart={t => { dragToolRef.current = t; }} />
        )}

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden relative"
          style={{ background: '#020810', cursor: panRef.current ? 'grabbing' : 'default' }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onWheel={handleWheel}>

          {/* Zoom/pan wrapper — centered */}
          <div style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                cursor: mode === 'design' ? 'crosshair' : 'default',
                display: 'block',
                width: '100%',
                height: '100%',
              }}
              onMouseDown={startPan}
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
              {showGrid && <rect width="100%" height="100%" fill="url(#grid)" />}

              {/* Boundary */}
              <rect x="4" y="4" width={CANVAS_W - 8} height={CANVAS_H - 8} rx="8"
                fill="none" stroke="rgba(0,212,255,0.1)" strokeWidth="1" strokeDasharray="8 5" />

              {/* Alignment guides */}
              {guides.x !== undefined && (
                <line x1={guides.x} y1={0} x2={guides.x} y2={CANVAS_H}
                  stroke="#00d4ff" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" />
              )}
              {guides.y !== undefined && (
                <line x1={0} y1={guides.y} x2={CANVAS_W} y2={guides.y}
                  stroke="#00d4ff" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" />
              )}

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

                    {sel && (
                      <rect x={z.x - 3} y={z.y - 3} width={z.width + 6} height={z.height + 6} rx="10"
                        fill="none" stroke={c} strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />
                    )}

                    <rect x={z.x} y={z.y} width={z.width} height={z.height} rx="6"
                      fill={`${c}${sel ? '22' : '12'}`}
                      stroke={c} strokeWidth={sel ? 2 : 1.2}
                      style={{ filter: sel ? `drop-shadow(0 0 8px ${c}60)` : 'none' }} />

                    <text x={z.x + 8} y={z.y + 16} fontSize="10" fill={c}
                      fontWeight="700" fontFamily="Inter,sans-serif">
                      {zoneIcons[z.type] ?? '✦'} {z.name}
                    </text>

                    <text x={z.x + 8} y={z.y + 28} fontSize="8.5" fill="rgba(255,255,255,0.4)"
                      fontFamily="JetBrains Mono,monospace">
                      cap: {z.maxCapacity.toLocaleString()}
                    </text>

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

          {/* Zoom hint */}
          <div className="absolute bottom-2 left-2 text-[9px] text-white/15 pointer-events-none">
            Ctrl+scroll to zoom · Alt+drag to pan · Del to delete · Ctrl+D to duplicate
          </div>
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
                onDelete={id => deleteZone(id)}
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
