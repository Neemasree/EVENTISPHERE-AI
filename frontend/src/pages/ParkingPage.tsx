import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, RotateCcw, Activity, Wifi, WifiOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import type { ActivityEvent } from '../components/parking/ActivityDrawer';
import ActivityDrawer from '../components/parking/ActivityDrawer';

const ParkingScene = lazy(() => import('../components/parking/ParkingScene'));

// ─── Types ────────────────────────────────────────────────────────────────────
interface Zone { id: 'A'|'B'; occupied: number; capacity: number }

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const pct = (z: Zone) => Math.round((z.occupied / z.capacity) * 100);
const zoneColor  = (p: number) =>
  p >= 95 ? '#f43f5e' : p >= 80 ? '#fb923c' : p >= 60 ? '#fbbf24' : '#00f5a0';
const zoneStatus = (p: number) =>
  p >= 100 ? 'FULL' : p >= 80 ? 'NEARLY FULL' : p >= 60 ? 'BUSY' : 'NORMAL';

function aiMsg(a: Zone, b: Zone): { text: string; level: 'info'|'warning'|'critical'|'full' } {
  const [pa, pb] = [pct(a), pct(b)];
  const [avA, avB] = [a.capacity - a.occupied, b.capacity - b.occupied];
  if (pa >= 100 && pb >= 100)
    return { text: 'Both lots FULL. Halt incoming vehicles immediately. Activate overflow protocol.', level: 'full' };
  if (pa >= 100)
    return { text: `Lot A FULL (${a.occupied}/${a.capacity}). Redirect ALL vehicles to Lot B — ${avB} spaces available.`, level: 'critical' };
  if (pb >= 100)
    return { text: `Lot B FULL (${b.occupied}/${b.capacity}). Redirect ALL vehicles to Lot A — ${avA} spaces available.`, level: 'critical' };
  if (pa >= 85)
    return { text: `Lot A at ${pa}% — only ${avA} left. Pre-route to Lot B (${pb}% — ${avB} free).`, level: 'critical' };
  if (pb >= 85)
    return { text: `Lot B at ${pb}% — only ${avB} left. Pre-route to Lot A (${pa}% — ${avA} free).`, level: 'critical' };
  if (pa >= 70 || pb >= 70)
    return { text: `${pa >= 70 ? `Lot A at ${pa}%` : `Lot B at ${pb}%`}. Monitor closely — consider early rerouting.`, level: 'warning' };
  return { text: `Lot A: ${pa}% (${avA} free)  ·  Lot B: ${pb}% (${avB} free). Traffic flowing normally.`, level: 'info' };
}

const LEVEL: Record<string,{ color:string; bg:string; border:string }> = {
  info:     { color:'#00d4ff', bg:'rgba(0,212,255,0.07)',  border:'rgba(0,212,255,0.2)'  },
  warning:  { color:'#fbbf24', bg:'rgba(251,191,36,0.08)', border:'rgba(251,191,36,0.22)' },
  critical: { color:'#fb923c', bg:'rgba(251,146,60,0.09)', border:'rgba(251,146,60,0.28)' },
  full:     { color:'#f43f5e', bg:'rgba(244,63,94,0.1)',   border:'rgba(244,63,94,0.3)'  },
};

// ─── Zone Card ────────────────────────────────────────────────────────────────
function ZoneCard({ zone, count, setCount, onEnter, onExit }: {
  zone: Zone; count: number; setCount:(n:number)=>void;
  onEnter:(n:number)=>void; onExit:(n:number)=>void;
}) {
  const p = pct(zone), col = zoneColor(p), avail = zone.capacity - zone.occupied;
  const isFull = zone.occupied >= zone.capacity, isEmpty = zone.occupied <= 0;
  const C = 2 * Math.PI * 38;
  const offset = C * (1 - Math.min(p, 100) / 100);

  return (
    <motion.div whileHover={{ y:-4, scale:1.015 }} transition={{ type:'spring', stiffness:300 }}
      className="rounded-2xl p-5 relative overflow-hidden cursor-default"
      style={{ background:`${col}08`, border:`1px solid ${col}30`,
        boxShadow: p >= 80 ? `0 0 28px ${col}18` : '0 4px 20px rgba(0,0,0,0.3)',
        animation: p >= 95 ? 'criticalPulse 1.8s ease-in-out infinite' : undefined }}>
      <div className="absolute top-0 left-4 right-4 h-px"
        style={{ background:`linear-gradient(90deg,transparent,${col}60,transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-0.5">Parking Lot</p>
          <p className="text-2xl font-bold text-white font-display">Lot {zone.id}</p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
          style={{ background:`${col}18`, color:col, border:`1px solid ${col}35` }}>{zoneStatus(p)}</span>
      </div>
      <div className="flex items-center gap-5 mb-5">
        <div className="relative flex-shrink-0 w-[92px] h-[92px]">
          <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
            <circle cx="46" cy="46" r="38" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9"/>
            <motion.circle cx="46" cy="46" r="38" fill="none" stroke={col} strokeWidth="9"
              strokeLinecap="round" strokeDasharray={C}
              animate={{ strokeDashoffset: offset }} transition={{ duration:0.8, ease:'easeOut' }}
              style={{ filter:`drop-shadow(0 0 6px ${col}80)` }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span key={p} initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }}
              className="text-2xl font-bold font-mono leading-none" style={{ color:col }}>{p}</motion.span>
            <span className="text-[9px] text-white/30 font-bold">%</span>
          </div>
        </div>
        <div className="space-y-2.5 flex-1">
          {([['Occupied',zone.occupied,col],['Capacity',zone.capacity,'rgba(255,255,255,0.45)'],
             ['Available',avail,avail===0?'#f43f5e':'#00f5a0']] as [string,number,string][]).map(([l,v,c])=>(
            <div key={l} className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{l}</span>
              <motion.span key={v} initial={{ y:-4,opacity:0 }} animate={{ y:0,opacity:1 }}
                className="text-[14px] font-bold font-mono" style={{ color:c }}>{v}</motion.span>
            </div>
          ))}
        </div>
      </div>
      <div className="progress-track mb-4">
        <motion.div className="progress-fill" animate={{ width:`${Math.min(p,100)}%` }}
          transition={{ duration:0.7 }}
          style={{ background:`linear-gradient(90deg,${col}70,${col})`, boxShadow:`0 0 6px ${col}` }} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={()=>setCount(Math.max(1,count-1))}
          className="w-8 h-9 rounded-xl font-bold text-white/50 hover:text-white transition-all"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>−</button>
        <input type="number" min={1} max={50} value={count}
          onChange={e=>setCount(Math.max(1,Math.min(50,+e.target.value||1)))}
          className="input-field text-sm font-mono text-center w-14 flex-shrink-0 py-2" />
        <button onClick={()=>setCount(Math.min(50,count+1))}
          className="w-8 h-9 rounded-xl font-bold text-white/50 hover:text-white transition-all"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>+</button>
        <motion.button whileTap={{ scale:0.94 }} onClick={()=>onEnter(count)} disabled={isFull}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all"
          style={isFull?{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.2)',cursor:'not-allowed' }
            :{ background:`linear-gradient(135deg,${col},${col}aa)`,color:'#020409',boxShadow:`0 0 16px ${col}35` }}>
          ↓ {count} Entered
        </motion.button>
        <motion.button whileTap={{ scale:0.94 }} onClick={()=>onExit(count)} disabled={isEmpty}
          className="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all"
          style={isEmpty?{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.2)',cursor:'not-allowed' }
            :{ background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',color:'rgba(255,255,255,0.75)' }}>
          ↑ {count} Exited
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ParkingPage() {
  const [zones, setZones] = useState<{A:Zone;B:Zone}>({
    A: { id:'A', occupied:42, capacity:100 },
    B: { id:'B', occupied:18, capacity:100 },
  });
  const [countA, setCountA]   = useState(1);
  const [countB, setCountB]   = useState(1);
  const [muted,  setMuted]    = useState(false);
  const [autoAn, setAutoAn]   = useState(false);
  const [events, setEvents]   = useState<ActivityEvent[]>([]);
  const [drawer, setDrawer]   = useState(false);
  const [conn,   setConn]     = useState(false);
  const socketRef  = useRef<Socket|null>(null);
  const prevMsgRef = useRef('');

  const ai = aiMsg(zones.A, zones.B);
  const sty = LEVEL[ai.level];
  const totalCap   = 200;
  const totalOcc   = zones.A.occupied + zones.B.occupied;
  const totalPct   = Math.round((totalOcc / totalCap) * 100);
  const totalAvail = totalCap - totalOcc;
  const latestCol  = events.length ? (LEVEL[events[events.length-1].type]?.color ?? '#6366f1') : '#6366f1';

  useEffect(() => {
    const s = io('http://localhost:4000',{transports:['websocket'],reconnectionAttempts:3,timeout:3000});
    socketRef.current = s;
    s.on('connect',    ()=>setConn(true));
    s.on('disconnect', ()=>setConn(false));
    s.on('zone_update',(d:{A:number;B:number})=>setZones(p=>({A:{...p.A,occupied:d.A},B:{...p.B,occupied:d.B}})));
    s.on('activity',   (ev:ActivityEvent)=>setEvents(p=>[...p.slice(-99),{...ev,timestamp:new Date(ev.timestamp)}]));
    return ()=>{ s.disconnect(); };
  }, []);

  const speak = useCallback((text:string, force=false) => {
    if (!force && muted) return;
    if (text === prevMsgRef.current && !force) return;
    prevMsgRef.current = text;
    try { window.speechSynthesis?.cancel(); window.speechSynthesis?.speak(Object.assign(new SpeechSynthesisUtterance(text),{rate:0.92,pitch:1,volume:0.8})); } catch {}
  }, [muted]);

  useEffect(() => {
    if (ai.level==='critical'||ai.level==='full') speak(ai.text,true);
    else if (autoAn) speak(ai.text);
  }, [ai.text]); // eslint-disable-line

  const addEv = useCallback((zone:'A'|'B', type:ActivityEvent['type'], message:string) => {
    setEvents(p=>[...p.slice(-99),{id:`ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,zone,type,message,timestamp:new Date()}]);
  }, []);

  const mutate = useCallback((id:'A'|'B', delta:number) => {
    setZones(prev=>{
      const z=prev[id], next=Math.max(0,Math.min(z.capacity,z.occupied+delta));
      const p=Math.round((next/z.capacity)*100);
      addEv(id,p>=95?'critical':p>=70?'warning':'info',
        `${Math.abs(delta)} vehicle${Math.abs(delta)>1?'s':''} ${delta>0?'entered':'exited'} Lot ${id} — ${next}/${z.capacity} (${p}%)`);
      socketRef.current?.emit('update_zone',{zone:id,occupied:next});
      return {...prev,[id]:{...z,occupied:next}};
    });
  }, [addEv]);

  const resetAll = () => {
    setZones(p=>({A:{...p.A,occupied:0},B:{...p.B,occupied:0}}));
    addEv('A','info','All zones reset to 0');
    socketRef.current?.emit('reset');
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-24">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Parking Intelligence Agent</h1>
          <p className="page-subtitle">Real-time lot monitoring · AI advisor · 3D simulation · voice alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
            style={conn?{background:'rgba(0,245,160,0.08)',border:'1px solid rgba(0,245,160,0.2)',color:'#00f5a0'}
              :{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.3)'}}>
            {conn?<Wifi size={11}/>:<WifiOff size={11}/>}
            <span className="ml-1">{conn?'Backend Connected':'Local Mode'}</span>
          </div>
          <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}}
            onClick={resetAll} className="btn-ghost gap-1.5 py-1.5 text-xs">
            <RotateCcw size={11}/> Reset All
          </motion.button>
        </div>
      </div>

      {/* KPI */}
      {(() => {
        const kpiItems: [string, number, string, string][] = [
          ['Total Capacity', totalCap,   '', '#00d4ff'],
          ['Total Occupied', totalOcc,   '', zoneColor(totalPct)],
          ['Available',      totalAvail, '', totalAvail === 0 ? '#f43f5e' : '#00f5a0'],
          ['Overall',        totalPct,  '%', zoneColor(totalPct)],
        ];
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kpiItems.map(([label, val, suf, col], i) => (
              <motion.div key={label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                className="rounded-2xl p-4 text-center relative overflow-hidden"
                style={{background:`${col}08`,border:`1px solid ${col}22`}}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px" style={{background:col}}/>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2 font-bold">{label}</p>
                <motion.p key={val} initial={{y:-6,opacity:0}} animate={{y:0,opacity:1}}
                  className="text-2xl font-bold font-mono" style={{color:col}}>{val}{suf}</motion.p>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {/* AI Advisor */}
      <motion.div key={ai.text} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}}
        className="flex items-start gap-4 px-5 py-4 rounded-2xl"
        style={{background:sty.bg,border:`1px solid ${sty.border}`,boxShadow:`0 0 20px ${sty.color}12`,
          animation:ai.level==='critical'||ai.level==='full'?'criticalPulse 1.5s ease-in-out infinite':undefined}}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{background:`${sty.color}15`,border:`1px solid ${sty.color}30`}}>
          {ai.level==='full'||ai.level==='critical'?'🚨':ai.level==='warning'?'⚠️':'🧠'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{color:sty.color}}>AI Parking Advisor</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
              style={{background:`${sty.color}18`,color:sty.color}}>{ai.level}</span>
          </div>
          <p className="text-[13px] text-white/80 leading-relaxed">{ai.text}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.button whileTap={{scale:0.93}} onClick={()=>speak(ai.text,true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
            style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
            <Volume2 size={13}/>
          </motion.button>
          <motion.button whileTap={{scale:0.93}} onClick={()=>setMuted(v=>!v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={muted?{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.25)'}
              :{background:'rgba(99,102,241,0.1)',border:'1px solid rgba(99,102,241,0.25)',color:'#818cf8'}}>
            {muted?<VolumeX size={13}/>:<Volume2 size={13}/>}
          </motion.button>
          <motion.button whileTap={{scale:0.93}} onClick={()=>setAutoAn(v=>!v)}
            className="px-3 py-2 rounded-xl text-[10px] font-bold transition-all"
            style={autoAn?{background:'rgba(0,245,160,0.1)',border:'1px solid rgba(0,245,160,0.25)',color:'#00f5a0'}
              :{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)'}}>
            AUTO
          </motion.button>
        </div>
      </motion.div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ZoneCard zone={zones.A} count={countA} setCount={setCountA} onEnter={n=>mutate('A',n)} onExit={n=>mutate('A',-n)}/>
        <ZoneCard zone={zones.B} count={countB} setCount={setCountB} onEnter={n=>mutate('B',n)} onExit={n=>mutate('B',-n)}/>
      </div>

      {/* 3D Scene */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label m-0">3D Parking Simulation</p>
          <p className="text-[10px] text-white/25 font-mono">Drag to rotate · 200 slots per zone · ACES filmic</p>
        </div>
        <Suspense fallback={
          <div className="w-full rounded-2xl flex items-center justify-center"
            style={{height:420,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div className="text-center">
              <motion.div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-3"
                animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}/>
              <p className="text-[12px] text-white/30">Loading 3D scene...</p>
            </div>
          </div>
        }>
          <ParkingScene
            occupiedA={Math.round(zones.A.occupied*2)} capacityA={200}
            occupiedB={Math.round(zones.B.occupied*2)} capacityB={200}
          />
        </Suspense>
      </div>

      {/* Live Updates FAB */}
      <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}}
        onClick={()=>setDrawer(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-5 py-3 rounded-2xl text-[13px] font-bold"
        style={{background:'rgba(6,12,24,0.97)',border:`1px solid ${latestCol}40`,color:'#fff',
          boxShadow:`0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${latestCol}18`,backdropFilter:'blur(20px)'}}>
        <Activity size={15} style={{color:latestCol}}/>
        Live Updates
        {events.length > 0 && (
          <motion.span key={events.length} initial={{scale:0}} animate={{scale:1}}
            className="text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
            style={{background:latestCol,boxShadow:`0 0 8px ${latestCol}`}}>
            {events.length > 99 ? '99+' : events.length}
          </motion.span>
        )}
      </motion.button>

      <ActivityDrawer events={events} open={drawer} onClose={()=>setDrawer(false)}/>
    </div>
  );
}
