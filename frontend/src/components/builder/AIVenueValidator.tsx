import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { Zone } from '../../types';

interface Suggestion {
  type: 'warning' | 'error' | 'info' | 'ok';
  title: string;
  detail: string;
}

interface ValidationResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  suggestions: Suggestion[];
}

function validateLayout(zones: Zone[]): ValidationResult {
  const suggestions: Suggestion[] = [];

  const has = (type: string) => zones.some(z => z.type === type);
  const count = (type: string) => zones.filter(z => z.type === type).length;
  const totalCap = zones.reduce((s, z) => s + z.maxCapacity, 0);

  if (zones.length === 0) return { score: 0, grade: 'F', suggestions: [{ type: 'error', title: 'No zones defined', detail: 'Add at least one zone to validate.' }] };

  // Gates
  if (!has('gate')) suggestions.push({ type: 'error', title: 'No entrance gate', detail: 'Every venue needs at least one gate for crowd entry.' });
  else if (count('gate') < 2) suggestions.push({ type: 'warning', title: 'Only one gate', detail: 'A single gate creates a bottleneck. Add Gate B for redundancy.' });

  // Emergency exits
  if (!has('emergency_exit')) suggestions.push({ type: 'error', title: 'No emergency exit', detail: 'Emergency exits are mandatory for safety compliance.' });
  else if (count('emergency_exit') < 2) suggestions.push({ type: 'warning', title: 'Only one emergency exit', detail: 'Add a second emergency exit on the opposite side of the venue.' });

  // Medical
  if (!has('medical')) suggestions.push({ type: 'warning', title: 'No medical bay', detail: 'A medical station is strongly recommended for events over 500 people.' });
  else {
    const medical = zones.find(z => z.type === 'medical')!;
    const stage = zones.find(z => z.type === 'stage');
    if (stage) {
      const dist = Math.sqrt(Math.pow(medical.x - stage.x, 2) + Math.pow(medical.y - stage.y, 2));
      if (dist > 250) suggestions.push({ type: 'warning', title: 'Medical bay too far from stage', detail: 'Medical response time increases with distance. Move it closer to the main stage.' });
    }
  }

  // Parking
  if (!has('parking')) suggestions.push({ type: 'info', title: 'No parking zone', detail: 'Consider adding a parking area if attendees are driving.' });
  else {
    const parkingCap = zones.filter(z => z.type === 'parking').reduce((s, z) => s + z.maxCapacity, 0);
    if (totalCap > 0 && parkingCap < totalCap * 0.2) suggestions.push({ type: 'warning', title: 'Parking may be insufficient', detail: `Parking capacity (${parkingCap}) is less than 20% of total venue capacity.` });
  }

  // Food
  if (!has('food')) suggestions.push({ type: 'info', title: 'No food court', detail: 'Food areas help distribute crowd and reduce congestion near the stage.' });

  // Stage
  if (!has('stage')) suggestions.push({ type: 'info', title: 'No main stage', detail: 'Add a stage zone to enable crowd flow monitoring around the performance area.' });

  // Restrooms
  if (!has('restroom')) suggestions.push({ type: 'warning', title: 'No washrooms', detail: 'Washroom zones help predict queue buildup and wait times.' });

  // Capacity check
  if (totalCap < 100) suggestions.push({ type: 'info', title: 'Low total capacity', detail: 'Total venue capacity seems low. Check individual zone capacities.' });

  // All good checks
  if (has('gate') && count('gate') >= 2) suggestions.push({ type: 'ok', title: 'Multiple gates configured', detail: 'Good — crowd can be distributed across entry points.' });
  if (has('medical') && has('emergency_exit')) suggestions.push({ type: 'ok', title: 'Emergency infrastructure present', detail: 'Medical bay and emergency exits are configured.' });

  const errors   = suggestions.filter(s => s.type === 'error').length;
  const warnings = suggestions.filter(s => s.type === 'warning').length;
  let score = 100 - (errors * 20) - (warnings * 8);
  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return { score, grade, suggestions };
}

const TYPE_CFG = {
  error:   { color: '#f43f5e', icon: <AlertTriangle size={12} />, bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)'   },
  warning: { color: '#fbbf24', icon: <AlertTriangle size={12} />, bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.2)'  },
  info:    { color: '#00d4ff', icon: <Info size={12} />,          bg: 'rgba(0,212,255,0.06)',   border: 'rgba(0,212,255,0.18)'  },
  ok:      { color: '#00f5a0', icon: <CheckCircle size={12} />,   bg: 'rgba(0,245,160,0.06)',   border: 'rgba(0,245,160,0.18)'  },
};

const GRADE_COLOR: Record<string, string> = { A: '#00f5a0', B: '#00d4ff', C: '#fbbf24', D: '#fb923c', F: '#f43f5e' };

interface Props { zones: Zone[]; onClose: () => void }

export default function AIVenueValidator({ zones, onClose }: Props) {
  const [running, setRunning] = useState(false);
  const [result, setResult]   = useState<ValidationResult | null>(null);

  const run = () => {
    setRunning(true);
    setResult(null);
    setTimeout(() => {
      setResult(validateLayout(zones));
      setRunning(false);
    }, 1800);
  };

  const gradeColor = result ? GRADE_COLOR[result.grade] : '#00d4ff';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'rgba(8,16,32,0.98)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 30px 80px rgba(0,0,0,0.7)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <Shield size={15} style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">AI Venue Validation</p>
              <p className="text-[10px] text-white/30 mt-0.5">{zones.length} zones · Safety & operations analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={15} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!result && !running && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏟️</div>
              <p className="text-[13px] text-white/50 mb-1">Ready to analyse your venue layout</p>
              <p className="text-[11px] text-white/25 mb-6">AI will check safety, capacity, and operational efficiency</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={run}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold mx-auto"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#0088cc)', color: '#020409', boxShadow: '0 0 24px rgba(0,212,255,0.3)' }}>
                <Zap size={14} /> Run AI Validation
              </motion.button>
            </div>
          )}

          {running && (
            <div className="text-center py-10">
              <motion.div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-4"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <p className="text-[13px] text-white/50">Analysing venue layout...</p>
              <p className="text-[10px] text-white/25 mt-1">Checking safety, capacity, and flow</p>
            </div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Score */}
                <div className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{ background: `${gradeColor}08`, border: `1px solid ${gradeColor}25` }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${gradeColor}15`, border: `2px solid ${gradeColor}40` }}>
                    <span className="text-3xl font-bold" style={{ color: gradeColor }}>{result.grade}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-white mb-1">Safety Score: {result.score}/100</p>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${result.score}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg,${gradeColor}80,${gradeColor})` }} />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">
                      {result.suggestions.filter(s => s.type === 'error').length} errors · {result.suggestions.filter(s => s.type === 'warning').length} warnings
                    </p>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="space-y-2">
                  {result.suggestions.map((s, i) => {
                    const cfg = TYPE_CFG[s.type];
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <span className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }}>{cfg.icon}</span>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: cfg.color }}>{s.title}</p>
                          <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{s.detail}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button onClick={run}
                  className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Re-run Analysis
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
