import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Shield, Clock, CheckCircle, MapPin, Radio,
  Volume2, Send, ChevronDown, ChevronUp, X, Phone, Zap, Users
} from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import EmergencyOverlay from '../components/emergency/EmergencyOverlay';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: '🔥 Fire',           value: 'Fire'          },
  { label: '🩺 Medical',        value: 'Medical'       },
  { label: '🚨 Security',       value: 'Security'      },
  { label: '👶 Lost Child',     value: 'Lost Child'    },
  { label: '👥 Crowd Surge',    value: 'Crowd Surge'   },
  { label: '🔧 Maintenance',    value: 'Maintenance'   },
  { label: '⚡ Power Failure',  value: 'Power Failure' },
];
const KNOWN_VALUES = new Set(CATEGORIES.map(c => c.value.toLowerCase()));

const LOCATIONS = ['Food Court','Main Stage','Gate A','Gate B','Parking A','Medical Bay','VIP Lounge','Main Exit'];
const PRIORITIES = ['Low','Medium','High','Critical'] as const;
type Priority = typeof PRIORITIES[number];

const CAT_ICONS: Record<string,string> = {
  fire:'🔥', medical:'🩺', security:'🚨', 'lost child':'👶',
  'crowd surge':'👥', maintenance:'🔧', 'power failure':'⚡',
};
const catIcon = (c: string) => CAT_ICONS[c?.toLowerCase()] ?? '🚨';

const SEV_COLOR: Record<string,string> = {
  critical:'#f43f5e', high:'#fb923c', medium:'#fbbf24', low:'#00f5a0',
};

const DEFAULT_ACTIONS = [
  'Dispatch Response Team Alpha',
  'Clear path and notify organiser',
  'Stop entry to affected zone',
  'Evacuate nearby visitors',
  'Keep emergency exits clear',
];

const INITIAL_TIMELINE: [string, string, 'done'|'active'|'future'][] = [
  ['T+0:00','Incident reported',      'done'  ],
  ['T+0:30','AI threat analysis',     'done'  ],
  ['T+1:00','Teams dispatched',       'active'],
  ['T+1:30','Voice alert broadcast',  'future'],
  ['T+3:00','Situation resolved',     'future'],
];

const CANNED: Record<string,string> = {
  greeting:        "Hello! I'm the Emergency AI. I'm monitoring the active incident. Ask me anything.",
  thanks:          "You're welcome. Stay focused on the incident.",
  acknowledgement: "Understood. Standing by. Ask about the incident anytime.",
  compliment:      "Thank you. My priority is accurate, incident-based guidance.",
  invalid:         "⚠ Please ask a clear question about the current incident.",
};

function classifyIntent(text: string): string {
  const t = text.trim().toLowerCase();
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(t)) return 'greeting';
  if (/^(thanks?|thank you|thx|ty|cheers)/.test(t)) return 'thanks';
  if (/^(ok(ay)?|got it|understood|roger|noted|sure)/.test(t)) return 'acknowledgement';
  if (/^(good job|well done|amazing|awesome|great work)/.test(t)) return 'compliment';
  if (/^[^a-z]*$/i.test(t) || t.length < 3) return 'invalid';
  return 'incident';
}

// ── Category combobox ─────────────────────────────────────────────────────────
function CategoryCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery]   = useState(value);
  const [open,  setOpen]    = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);
  const isKnown             = KNOWN_VALUES.has(query.trim().toLowerCase());
  const filtered            = query.trim()
    ? CATEGORIES.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : CATEGORIES;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (v: string) => { setQuery(v); onChange(v); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        placeholder="Search or type category..."
        className="input-field text-sm w-full"
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl overflow-hidden"
            style={{ background: 'rgba(8,15,32,0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
            {filtered.map(c => (
              <button key={c.value} onMouseDown={() => select(c.value)}
                className="w-full text-left px-3.5 py-2.5 text-[12px] text-white/70 hover:bg-white/6 hover:text-white transition-colors">
                {c.label}
              </button>
            ))}
            {query.trim().length >= 3 && !isKnown && (
              <button onMouseDown={() => select(query.trim())}
                className="w-full text-left px-3.5 py-2.5 text-[12px] text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center gap-2">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">CUSTOM</span>
                Use "{query.trim()}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {query.trim() && (
        <p className="text-[9px] mt-1.5 font-bold"
          style={{ color: isKnown ? '#00f5a0' : '#a855f7' }}>
          {isKnown ? '🟢 Rule Engine + AI' : '🟣 AI Generated'}
        </p>
      )}
    </div>
  );
}

// ── Venue mini-map (reads live zones from store) ─────────────────────────────
function VenueMap({ active, location }: { active: boolean; location: string }) {
  const zones = useEventStore(s => s.zones);
  const loc   = location.toLowerCase();

  // Compute bounding box of all zones to normalise positions
  const minX = Math.min(...zones.map(z => z.x));
  const minY = Math.min(...zones.map(z => z.y));
  const maxX = Math.max(...zones.map(z => z.x + z.width));
  const maxY = Math.max(...zones.map(z => z.y + z.height));
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toPercent = (z: typeof zones[0]) => ({
    left:   ((z.x - minX) / rangeX) * 96,
    top:    ((z.y - minY) / rangeY) * 92,
    width:  (z.width  / rangeX) * 96,
    height: (z.height / rangeY) * 92,
  });

  const isActive = (z: typeof zones[0]) => {
    if (!active) return false;
    return z.name.toLowerCase().includes(loc) || loc.includes(z.name.toLowerCase());
  };

  const zoneIcons: Record<string, string> = {
    parking: '🚗', gate: '🚪', vip: '⭐', stage: '🎵',
    food: '🍔', medical: '🏥', restroom: '🚻', exit: '↩', emergency_exit: '🚨',
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden"
      style={{ paddingBottom: '56%', background: '#030812', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="absolute inset-0">
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="eg" width="8%" height="12.5%" patternUnits="objectBoundingBox">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#eg)" />
        </svg>

        {zones.map(z => {
          const on  = isActive(z);
          const pos = toPercent(z);
          const riskColors: Record<string, string> = {
            critical: '#f43f5e', high: '#fb923c', medium: '#fbbf24', low: '#00f5a0',
          };
          const rColor = riskColors[z.riskLevel] ?? '#00f5a0';
          return (
            <div key={z.id}
              className="absolute flex flex-col items-center justify-center rounded-lg transition-all duration-300"
              style={{
                left: `${pos.left}%`, top: `${pos.top}%`,
                width: `${pos.width}%`, height: `${pos.height}%`,
                background: on ? 'rgba(244,63,94,0.18)' : `${rColor}08`,
                border: on ? '1px solid rgba(244,63,94,0.6)' : `1px solid ${rColor}25`,
                boxShadow: on ? '0 0 16px rgba(244,63,94,0.3)' : 'none',
                animation: on ? 'criticalPulse 1.2s ease-in-out infinite' : 'none',
              }}>
              <span className="text-[7px] leading-none mb-0.5">{zoneIcons[z.type] ?? '📍'}</span>
              <span className="text-[6px] font-bold uppercase tracking-wider text-center leading-tight px-0.5"
                style={{ color: on ? '#f43f5e' : `${rColor}cc` }}>
                {z.name.replace(' ', '\n')}
              </span>
              {on && (
                <motion.div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                  style={{ background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }}
                  animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              )}
            </div>
          );
        })}

        {/* Response trucks */}
        {active && (
          <>
            <motion.div className="absolute text-base" style={{ bottom: '6%', left: '10%' }}
              animate={{ x: [0, 15, 0] }} transition={{ duration: 3, repeat: Infinity }}>🚒</motion.div>
            <motion.div className="absolute text-base" style={{ bottom: '6%', left: '22%' }}
              animate={{ x: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}>🚑</motion.div>
          </>
        )}

        <div className="absolute bottom-1.5 left-2 text-[8px] font-mono text-white/25">
          FOCUS: {location.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

// ── Dispatch units ────────────────────────────────────────────────────────────
const UNIT_ICONS = ['🚒','🚑','🛡','🔧','♟'];
function DispatchPanel({ step, teams }: { step: number; teams: string[] }) {
  const statuses = [
    step >= 5 ? 'ARRIVED' : step >= 3 ? 'EN ROUTE' : 'DISPATCHING',
    step >= 4 ? 'EN ROUTE' : 'ALLOCATING',
    'ARRIVED',
  ];
  return (
    <div className="space-y-2">
      {teams.slice(0, 3).map((t, i) => {
        const arrived = statuses[i] === 'ARRIVED';
        const color   = arrived ? '#00f5a0' : statuses[i] === 'EN ROUTE' ? '#fbbf24' : '#00d4ff';
        return (
          <div key={t} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
            style={{ background: `${color}07`, border: `1px solid ${color}18` }}>
            <motion.span className="text-lg select-none"
              animate={!arrived ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}>
              {UNIT_ICONS[i]}
            </motion.span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white/80 truncate">{t}</p>
              <p className="text-[9px] font-mono" style={{ color }}>{statuses[i]}</p>
            </div>
            <span className="text-[10px] font-mono font-bold flex-shrink-0" style={{ color }}>
              {arrived ? '✓' : i === 0 ? '2m' : '3m'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── AI Chat ───────────────────────────────────────────────────────────────────
interface ChatMsg { role: 'user'|'ai'; text: string; confidence?: string; error?: boolean }
const QUICK = ["Can visitors use Gate A?","Should we evacuate?","Which team is responding?","Is it under control?"];

function AIChat({ category, location }: { category: string; location: string }) {
  const [msgs,      setMsgs]    = useState<ChatMsg[]>([]);
  const [input,     setInput]   = useState('');
  const [asking,    setAsking]  = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, asking]);

  const send = useCallback(async (q?: string) => {
    const text = (q ?? input).trim();
    if (!text || asking) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text }]);
    const intent = classifyIntent(text);
    if (intent !== 'incident') {
      setTimeout(() => setMsgs(m => [...m, { role: 'ai', text: CANNED[intent] ?? CANNED.invalid, confidence: 'High' }]), 400);
      return;
    }
    setAsking(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, context: { category, location } }),
      });
      if (res.ok) {
        const d = await res.json();
        setMsgs(m => [...m, { role: 'ai', text: d.answer, confidence: d.confidence }]);
      } else throw new Error();
    } catch {
      // Offline fallback
      const fallbacks: Record<string,string> = {
        'gate':     `Gate A is currently restricted due to the ${category} incident. Use Gate B or C for alternative entry/exit.`,
        'evacuate': `Evacuation of the affected zone (${location}) is recommended. Emergency teams are en route.`,
        'team':     `Team Alpha (Fire/Medical) is responding to ${location}. ETA: 2 minutes.`,
        'control':  `The situation at ${location} is being actively managed. All 3 response teams are deployed.`,
      };
      const key = Object.keys(fallbacks).find(k => text.toLowerCase().includes(k));
      const answer = key ? fallbacks[key] : `The AI assistant is currently offline. Based on protocol: the ${category} incident at ${location} is being handled by designated response teams. Follow standard emergency procedures.`;
      setMsgs(m => [...m, { role: 'ai', text: answer, confidence: 'Medium' }]);
    } finally { setAsking(false); }
  }, [input, asking, category, location]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0" style={{ maxHeight: 260 }}>
        {msgs.length === 0 && (
          <div className="py-2">
            <p className="text-[11px] text-white/30 mb-3">Ask about the active incident:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                  style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.18)', color: 'rgba(0,212,255,0.8)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'ai' && <span className="text-sm mt-0.5 flex-shrink-0">🤖</span>}
            <div className="max-w-[82%]">
              <div className="px-3 py-2 rounded-xl text-[11px] leading-relaxed"
                style={m.role === 'user' ? {
                  background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff',
                } : {
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.8)',
                }}>
                {m.text}
              </div>
              {m.role === 'ai' && m.confidence && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  {['Incident Context','Rule Engine','Groq AI'].map(s => (
                    <span key={s} className="text-[8px] text-white/25">✓ {s}</span>
                  ))}
                  <span className="text-[8px] font-bold ml-auto"
                    style={{ color: m.confidence === 'High' ? '#00f5a0' : '#fbbf24' }}>
                    {m.confidence}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {asking && (
          <div className="flex gap-2 justify-start">
            <span className="text-sm">🤖</span>
            <div className="px-3 py-2.5 rounded-xl flex gap-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about the incident..."
          className="input-field text-[12px] flex-1" />
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
          onClick={() => send()} disabled={!input.trim() || asking}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: input.trim() ? 'linear-gradient(135deg,#f43f5e,#c0102c)' : 'rgba(255,255,255,0.06)',
            boxShadow: input.trim() ? '0 0 14px rgba(244,63,94,0.35)' : 'none',
          }}>
          <Send size={13} style={{ color: input.trim() ? '#fff' : 'rgba(255,255,255,0.3)' }} />
        </motion.button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
let incCounter = 1;
function makeId() {
  const d = new Date();
  return `INC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(incCounter++).padStart(4,'0')}`;
}

interface AIResponse {
  category: string; location: string; severity: string;
  summary: string; enhanced_action_plan: string[];
  safety_precautions: string[]; dispatch_team: string[];
  estimated_response_time: string; voice_announcement: string;
  timestamp: string; is_custom_category?: boolean;
}

export default function EmergencyPage() {
  const { incidents: storeIncidents, addAlert } = useEventStore();

  // Form
  const [category,  setCategory]  = useState('Medical');
  const [location,  setLocation]  = useState('Main Stage');
  const [priority,  setPriority]  = useState<Priority>('Critical');
  const [formError, setFormError] = useState('');

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [running,    setRunning]    = useState(false);
  const [step,       setStep]       = useState(0);
  const [progress,   setProgress]   = useState(0);
  const [timeline,   setTimeline]   = useState(INITIAL_TIMELINE);
  const [aiResp,     setAiResp]     = useState<AIResponse | null>(null);
  const [incidentId, setIncidentId] = useState('INC-----------');
  const [history,    setHistory]    = useState<AIResponse[]>([]);
  const [showHistory,setShowHistory]= useState(false);

  // Overlay for full-screen emergency modal (legacy)
  const [overlayInc, setOverlayInc] = useState<any>(null);

  const sevColor = SEV_COLOR[(aiResp?.severity ?? priority).toLowerCase()] ?? '#f43f5e';

  const actions = Array.isArray(aiResp?.enhanced_action_plan)
    ? aiResp!.enhanced_action_plan
    : DEFAULT_ACTIONS;

  const speak = () => {
    const text = aiResp?.voice_announcement
      ?? `Attention. ${category} incident at ${location}. Emergency response teams have been dispatched. Please follow emergency exit signs.`;
    try { window.speechSynthesis?.cancel(); window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text)); } catch {}
  };

  const simulate = async () => {
    if (simulating) return;
    if (!category.trim() || category.length < 2) { setFormError('Select or enter a valid category.'); return; }
    if (!location.trim()) { setFormError('Enter a location.'); return; }
    setFormError('');

    const newId = makeId();
    setIncidentId(newId);
    setSimulating(true);
    setRunning(true);
    setStep(0);
    setProgress(0);
    setTimeline(INITIAL_TIMELINE);

    // Progress + step animation
    const stepTimers = [650,1300,2000,2700,3500,4300].map((t,i) =>
      setTimeout(() => setStep(i+1), t)
    );
    const prog = setInterval(() => setProgress(v => { if(v>=100){clearInterval(prog);return 100;} return v+2; }), 55);
    const done = setTimeout(() => setTimeline(t => t.map(x => [x[0],x[1],'done' as const])), 5000);

    try {
      const res = await fetch('/api/emergency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, priority, location }),
      });
      if (res.ok) {
        const data: AIResponse = await res.json();
        setAiResp(data);
        setHistory(h => [data, ...h].slice(0, 10));
      } else throw new Error();
    } catch {
      // Offline fallback
      const fallback: AIResponse = {
        category, location, severity: priority,
        summary: `${category} incident detected near ${location}. AI response protocols activated.`,
        enhanced_action_plan: DEFAULT_ACTIONS,
        safety_precautions: ['Keep emergency exits clear.','Prevent crowd congestion near the zone.'],
        dispatch_team: ['Team Alpha — Fire/Medical','Team Bravo — Security','Team Charlie — Logistics'],
        estimated_response_time: '2 min',
        voice_announcement: `Attention. ${category} incident near ${location}. Emergency response teams have been dispatched. Please follow emergency exit signs and remain calm.`,
        timestamp: new Date().toISOString(),
        is_custom_category: !KNOWN_VALUES.has(category.toLowerCase()),
      };
      setAiResp(fallback);
      setHistory(h => [fallback, ...h].slice(0, 10));
    } finally { setSimulating(false); }

    setTimeout(() => setRunning(false), 6200);
    return () => { stepTimers.forEach(clearTimeout); clearInterval(prog); clearTimeout(done); };
  };

  // Map store incidents to overlay format
  const allIncidents = storeIncidents.map(i => ({
    id: i.id, type: i.severity === 'critical' ? 'medical' as const : 'security' as const,
    title: i.description, zone: i.zone, severity: i.severity,
    description: i.description, teamEta: i.responseTime || 2, teamDist: 45,
    status: i.resolved ? 'resolved' as const : 'active' as const, timestamp: i.time,
  }));

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Emergency Response Center</h1>
          <p className="page-subtitle">
            AI-coordinated incident management — simulate, dispatch, and resolve emergencies in real time
          </p>
        </div>
        {/* Incident ID badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevColor, boxShadow: `0 0 6px ${sevColor}` }} />
          <span className="text-[11px] font-mono text-white/50">{incidentId}</span>
        </div>
      </div>

      {/* ── Status banner — shown when running ── */}
      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0,   height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
            className="flex items-center flex-wrap gap-4 px-5 py-3 rounded-2xl"
            style={{
              background: `${sevColor}10`,
              border: `1px solid ${sevColor}40`,
              boxShadow: `0 0 24px ${sevColor}18`,
              animation: 'criticalPulse 1.6s ease-in-out infinite',
            }}
          >
            <motion.div className="flex items-center gap-2"
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}>
              <AlertCircle size={16} style={{ color: sevColor }} />
              <span className="text-[13px] font-bold" style={{ color: sevColor }}>
                {catIcon(category)} {priority.toUpperCase()} — {category.toUpperCase()}
              </span>
            </motion.div>
            <span className="text-[12px] text-white/50 flex items-center gap-1.5">
              <MapPin size={11} /> {location}
            </span>
            <span className="text-[12px] text-white/50 flex items-center gap-1.5">
              <Users size={11} /> {aiResp?.dispatch_team?.length ?? 3} teams active
            </span>
            <span className="text-[12px] text-white/50 flex items-center gap-1.5">
              <Clock size={11} /> ETA {aiResp?.estimated_response_time ?? '2 min'}
            </span>
            {/* Progress bar */}
            <div className="flex-1 min-w-[120px] h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div className="h-full rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{ background: `linear-gradient(90deg,${sevColor}80,${sevColor})` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Row 1: Simulator form | Venue map | Dispatch ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Simulator form */}
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.25)' }}>
              <Zap size={13} className="text-red-400" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">Create Incident</p>
              <p className="text-[9px] text-white/30 mt-0.5">Simulate + trigger AI response</p>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Category</p>
            <CategoryCombobox value={category} onChange={setCategory} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Location</p>
            <input value={location} onChange={e => setLocation(e.target.value)}
              list="em-locs" placeholder="e.g. Main Stage"
              className="input-field text-sm w-full" />
            <datalist id="em-locs">{LOCATIONS.map(l => <option key={l} value={l}/>)}</datalist>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Priority</p>
            <div className="grid grid-cols-4 gap-1.5">
              {PRIORITIES.map(p => {
                const c = SEV_COLOR[p.toLowerCase()] ?? '#fff';
                const active = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)}
                    className="py-2 rounded-xl text-[11px] font-bold transition-all"
                    style={{
                      background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? c+'50' : 'rgba(255,255,255,0.08)'}`,
                      color: active ? c : 'rgba(255,255,255,0.35)',
                      boxShadow: active ? `0 0 12px ${c}25` : 'none',
                    }}>{p}</button>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="text-[11px] px-3 py-2 rounded-xl"
              style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f87171' }}>
              ⚠ {formError}
            </p>
          )}

          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            onClick={simulate} disabled={simulating}
            className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
            style={{
              background: simulating ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,#f43f5e,#c0102c)`,
              color: simulating ? 'rgba(255,255,255,0.3)' : '#fff',
              boxShadow: simulating ? 'none' : '0 0 24px rgba(244,63,94,0.35)',
            }}>
            <AlertCircle size={14} />
            {simulating ? 'Simulating...' : 'Simulate Incident'}
          </motion.button>
        </div>

        {/* Venue map */}
        <div className="rounded-2xl p-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-white">Live Venue Intelligence</p>
            {running && (
              <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:0.8, repeat:Infinity }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[9px] font-mono text-red-400 font-bold">ALARM</span>
              </motion.div>
            )}
          </div>
          <VenueMap active={running} location={location} />
          {/* Containment bar */}
          {running && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/35 uppercase tracking-wider font-bold">Containment</span>
                <span className="font-mono" style={{ color: sevColor }}>
                  {Math.min(67, Math.floor(progress * 0.67))}%
                </span>
              </div>
              <div className="progress-track">
                <motion.div className="progress-fill"
                  animate={{ width:`${Math.min(67, Math.floor(progress * 0.67))}%` }}
                  transition={{ duration:0.4 }}
                  style={{ background:`linear-gradient(90deg,${sevColor}80,${sevColor})` }} />
              </div>
            </div>
          )}
        </div>

        {/* Dispatch panel */}
        <div className="rounded-2xl p-4 space-y-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Unit Dispatch</p>
            <span className="text-[10px] font-mono text-white/30">
              {aiResp?.dispatch_team?.length ?? 3} units
            </span>
          </div>
          <DispatchPanel step={step}
            teams={aiResp?.dispatch_team ?? ['Team Alpha — Fire/Medical','Team Bravo — Security','Team Charlie — Logistics']} />

          {/* AI summary */}
          {aiResp?.summary && (
            <div className="rounded-xl p-3.5 mt-2"
              style={{ background:'rgba(0,212,255,0.05)', border:'1px solid rgba(0,212,255,0.15)' }}>
              <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider mb-1.5">
                ✦ AI Summary
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">{aiResp.summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Response plan | Timeline | Voice ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* AI Response plan */}
        <div className="rounded-2xl p-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-white">AI Response Plan</p>
            <span className="text-[9px] font-mono text-white/25 px-2 py-1 rounded-lg"
              style={{ background:'rgba(255,255,255,0.04)' }}>
              {aiResp ? 'LIVE' : 'PROTOCOL AUTO'}
            </span>
          </div>
          <div className="space-y-2">
            {actions.map((action, i) => {
              const done = i < step || !running;
              return (
                <motion.div key={action}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: done ? 'rgba(0,245,160,0.06)' : 'rgba(255,255,255,0.03)',
                    border: done ? '1px solid rgba(0,245,160,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <span className="text-[12px] font-bold flex-shrink-0 mt-0.5"
                    style={{ color: done ? '#00f5a0' : 'rgba(255,255,255,0.2)' }}>
                    {done ? '✓' : `${i+1}`}
                  </span>
                  <p className="text-[11px] leading-snug"
                    style={{ color: done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)' }}>
                    {action}
                  </p>
                </motion.div>
              );
            })}
          </div>
          {/* Safety precautions */}
          {aiResp?.safety_precautions?.length && (
            <div className="mt-3 pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-bold">Safety</p>
              {aiResp.safety_precautions.slice(0,2).map(s => (
                <p key={s} className="text-[10px] text-white/40 flex items-center gap-1.5 mb-1">
                  <span className="text-emerald-400">✓</span>{s}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="rounded-2xl p-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-bold text-white">Live Timeline</p>
            <span className="live-dot w-1.5 h-1.5" />
          </div>
          <div className="space-y-0">
            {timeline.filter((_, i) => !running || i <= step + 1).map(([time, label, state], i) => (
              <motion.div key={label}
                initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i*0.06 }}
                className="flex gap-3 group">
                <div className="flex flex-col items-center flex-shrink-0 w-3">
                  <motion.div
                    initial={{ scale:0 }} animate={{ scale:1 }}
                    transition={{ delay: i*0.06+0.1, type:'spring', stiffness:400 }}
                    className="w-2.5 h-2.5 rounded-full mt-3 flex-shrink-0"
                    style={{
                      background: state==='done' ? '#00f5a0' : state==='active' ? '#00d4ff' : 'rgba(255,255,255,0.15)',
                      boxShadow: state==='active' ? '0 0 8px rgba(0,212,255,0.8)' : state==='done' ? '0 0 6px rgba(0,245,160,0.6)' : 'none',
                      animation: state==='active' ? 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                    }} />
                  {i < timeline.length-1 && (
                    <div className="w-px flex-1 min-h-[16px] mt-1"
                      style={{ background: state==='done' ? 'rgba(0,245,160,0.3)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <p className="text-[11px] font-bold leading-none mb-0.5"
                    style={{ color: state==='done'?'#fff':state==='active'?'#00d4ff':'rgba(255,255,255,0.3)' }}>
                    {label}
                  </p>
                  <p className="text-[9px] font-mono"
                    style={{ color: state==='done'?'rgba(0,245,160,0.6)':state==='active'?'rgba(0,212,255,0.5)':'rgba(255,255,255,0.2)' }}>
                    {time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Voice announcement */}
        <div className="rounded-2xl p-4 flex flex-col gap-4"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-white">Voice Announcement</p>
            <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.4, repeat:Infinity }}
              className="text-[9px] font-bold text-red-400 font-mono">LIVE</motion.div>
          </div>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.94 }}
            onClick={speak}
            className="flex items-center justify-center gap-3 py-5 rounded-2xl transition-all"
            style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.25)',
              boxShadow: '0 0 20px rgba(244,63,94,0.08)',
            }}>
            <Volume2 size={28} className="text-red-400" />
            <div className="flex gap-0.5 items-end">
              {[10,16,22,16,10].map((h,i) => (
                <motion.div key={i}
                  className="w-1 rounded-full bg-red-400"
                  animate={{ height:[h/2, h, h/2] }}
                  transition={{ duration:0.6, repeat:Infinity, delay:i*0.1 }}
                  style={{ height: h }}
                />
              ))}
            </div>
          </motion.button>
          <p className="text-[11px] text-white/40 leading-relaxed italic text-center px-2">
            "{(aiResp?.voice_announcement ?? `Attention. ${category} incident near ${location}. Emergency response teams have been dispatched.`).slice(0, 100)}..."
          </p>
          <p className="text-[9px] text-white/20 text-center">Click speaker to broadcast</p>
        </div>
      </div>

      {/* Incident History */}
      {history.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setShowHistory(h => !h)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2.5">
              <Clock size={13} className="text-white/40" />
              <span className="text-[13px] font-bold text-white">Incident History</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)' }}>
                {history.length}
              </span>
            </div>
            {showHistory ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                transition={{ duration:0.25 }}
                className="overflow-hidden">
                <div className="px-5 pb-4 space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-base">{catIcon(h.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white/70 truncate">{h.category} — {h.location}</p>
                        <p className="text-[9px] text-white/30 font-mono">{new Date(h.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                        style={{
                          background: `${SEV_COLOR[h.severity?.toLowerCase()] ?? '#f43f5e'}15`,
                          color: SEV_COLOR[h.severity?.toLowerCase()] ?? '#f43f5e',
                        }}>
                        {h.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {overlayInc && (
        <EmergencyOverlay incident={overlayInc} onDismiss={() => setOverlayInc(null)} />
      )}
    </div>
  );
}
