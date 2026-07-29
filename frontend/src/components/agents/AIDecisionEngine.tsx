import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, CheckCircle, Clock, Zap } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import type { Zone } from '../../types';

interface Decision {
  id: string;
  agent: string;
  agentIcon: string;
  trigger: string;
  reasoning: string[];
  action: string;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  zone: string;
  timestamp: Date;
  executed: boolean;
}

function deriveDecisions(zones: Zone[]): Decision[] {
  const decisions: Decision[] = [];
  const now = new Date();

  zones.forEach(z => {
    if (z.occupancy >= 85 && z.type === 'food') {
      decisions.push({
        id: `d_${z.id}`, agent: 'Crowd Agent', agentIcon: '👥',
        trigger: `${z.name} at ${z.occupancy}% capacity`,
        reasoning: [
          `Current crowd: ${z.currentCrowd} / ${z.maxCapacity}`,
          `Wait time: ${z.waitingTime} min — above threshold`,
          `Overflow predicted in ~${Math.max(1, Math.round((z.maxCapacity - z.currentCrowd) / 15))} min`,
          'Historical pattern: food zones overflow faster on weekends',
        ],
        action: `Expand ${z.name} — open additional service points`,
        confidence: Math.min(99, 78 + z.occupancy - 85),
        priority: z.occupancy >= 95 ? 'critical' : 'high',
        zone: z.name, timestamp: now, executed: false,
      });
    }
    if (z.occupancy >= 80 && z.type === 'gate') {
      decisions.push({
        id: `d_${z.id}`, agent: 'Gate Agent', agentIcon: '🚪',
        trigger: `${z.name} queue at ${z.occupancy}%`,
        reasoning: [
          `Queue length: ${z.currentCrowd} people`,
          `Wait time: ${z.waitingTime} min`,
          'Adjacent gates have available capacity',
          'Signage redirect reduces queue by ~30% in 2 min',
        ],
        action: `Redirect crowd from ${z.name} to lower-load gate`,
        confidence: Math.min(99, 80 + z.occupancy - 80),
        priority: z.occupancy >= 90 ? 'critical' : 'high',
        zone: z.name, timestamp: now, executed: false,
      });
    }
    if (z.occupancy >= 80 && z.type === 'parking') {
      decisions.push({
        id: `d_${z.id}`, agent: 'Parking Agent', agentIcon: '🚗',
        trigger: `${z.name} at ${z.occupancy}% — near full`,
        reasoning: [
          `${z.maxCapacity - z.currentCrowd} spaces remaining`,
          'Inbound vehicle rate: ~15/min',
          'Alternative lot has capacity',
          'Dynamic signage update takes <30 seconds',
        ],
        action: `Update signage: route vehicles away from ${z.name}`,
        confidence: 94,
        priority: 'high',
        zone: z.name, timestamp: now, executed: false,
      });
    }
    if (z.riskLevel === 'critical') {
      decisions.push({
        id: `d_emg_${z.id}`, agent: 'Emergency Agent', agentIcon: '🚨',
        trigger: `CRITICAL risk level in ${z.name}`,
        reasoning: [
          `Occupancy: ${z.occupancy}% — above critical threshold`,
          'Crowd density exceeds safe limits',
          'Emergency protocol triggered automatically',
          'Response team on standby',
        ],
        action: `Deploy crowd safety team to ${z.name} immediately`,
        confidence: 97,
        priority: 'critical',
        zone: z.name, timestamp: now, executed: false,
      });
    }
  });

  return decisions.slice(0, 6);
}

const PRIORITY_CFG = {
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.22)', label: 'CRITICAL' },
  high:     { color: '#fb923c', bg: 'rgba(251,146,60,0.07)', border: 'rgba(251,146,60,0.2)',  label: 'HIGH'     },
  medium:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)',  label: 'MEDIUM'   },
  low:      { color: '#00f5a0', bg: 'rgba(0,245,160,0.06)',  border: 'rgba(0,245,160,0.18)', label: 'LOW'      },
};

export default function AIDecisionEngine() {
  const zones = useEventStore(s => s.zones);
  const applyRecommendation = useEventStore(s => s.applyRecommendation);
  const [decisions, setDecisions] = useState<Decision[]>(() => deriveDecisions(zones));
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [executed, setExecuted]   = useState<Set<string>>(new Set());

  useEffect(() => {
    setDecisions(deriveDecisions(zones));
  }, [zones]);

  const execute = (id: string) => {
    setExecuted(prev => new Set([...prev, id]));
    // Also apply matching recommendation if exists
    applyRecommendation(id.replace('d_', 'rec_'));
  };

  if (decisions.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-2xl mb-2">✅</div>
        <p className="text-[13px] text-white/40">No active decisions — all zones within normal parameters</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(6,12,24,0.8)', border: '1px solid rgba(0,212,255,0.12)' }}>
      <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
            <Brain size={15} style={{ color: '#00d4ff' }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">AI Decision Engine</p>
            <p className="text-[10px] text-white/30 mt-0.5">{decisions.length} active decisions · live from zone state</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00d4ff' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <span className="text-[10px] text-white/30 font-mono">LIVE</span>
        </div>
      </div>

      {/* Decision list */}
      <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <AnimatePresence>
          {decisions.map((d, i) => {
            const cfg  = PRIORITY_CFG[d.priority];
            const done = executed.has(d.id);
            const open = expanded === d.id;

            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                {/* Decision row */}
                <div className="px-5 py-3.5" style={{ background: done ? 'rgba(0,245,160,0.03)' : cfg.bg }}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">{d.agentIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: `${cfg.color}18`, color: cfg.color }}>{cfg.label}</span>
                        <span className="text-[11px] font-semibold text-white/70">{d.agent}</span>
                        <span className="text-[10px] text-white/25">→ {d.zone}</span>
                      </div>
                      <p className="text-[12px] text-white/80 font-medium mb-1">{d.trigger}</p>
                      <p className="text-[11px] text-white/45 leading-relaxed">{d.action}</p>

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                            animate={{ width: `${d.confidence}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                            style={{ background: `linear-gradient(90deg,${cfg.color}60,${cfg.color})` }} />
                        </div>
                        <span className="text-[10px] font-mono text-white/35">{d.confidence}% conf.</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => setExpanded(open ? null : d.id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      {done ? (
                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: 'rgba(0,245,160,0.1)', color: '#00f5a0', border: '1px solid rgba(0,245,160,0.2)' }}>
                          <CheckCircle size={10} /> Done
                        </div>
                      ) : (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => execute(d.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                          style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}35` }}>
                          <Zap size={10} /> Execute
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Reasoning chain */}
                  <AnimatePresence>
                    {open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3 ml-9">
                        <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-2">Reasoning Chain</p>
                          {d.reasoning.map((r, ri) => (
                            <div key={ri} className="flex items-start gap-2">
                              <span className="text-[9px] font-mono text-white/20 flex-shrink-0 mt-0.5">{ri + 1}.</span>
                              <p className="text-[10px] text-white/50 leading-relaxed">{r}</p>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <Clock size={9} style={{ color: 'rgba(255,255,255,0.2)' }} />
                            <span className="text-[9px] text-white/20">{d.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
