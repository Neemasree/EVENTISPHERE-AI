import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, X, AlertTriangle, CheckCircle, Info, XCircle, Download } from 'lucide-react';
import type { Zone } from '../../types';

interface Check { id: string; label: string; pass: boolean; severity: 'error' | 'warning' | 'info'; detail: string; fix?: string }
interface Category { id: string; label: string; icon: string; checks: Check[]; score: number }
interface Report { categories: Category[]; overall: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; totalZones: number; totalCapacity: number; criticalCount: number; warningCount: number }

function dist(a: Zone, b: Zone) {
  return Math.round(Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)));
}

function buildReport(zones: Zone[]): Report {
  const has  = (t: string) => zones.some(z => z.type === t);
  const cnt  = (t: string) => zones.filter(z => z.type === t).length;
  const get  = (t: string) => zones.find(z => z.type === t);
  const all  = (t: string) => zones.filter(z => z.type === t);
  const totalCap = zones.reduce((s, z) => s + z.maxCapacity, 0);
  const parkCap  = all('parking').reduce((s, z) => s + z.maxCapacity, 0);

  const safety: Check[] = [
    {
      id: 's1', label: 'Emergency exits present', severity: 'error',
      pass: has('emergency_exit'),
      detail: has('emergency_exit') ? `${cnt('emergency_exit')} emergency exit(s) configured.` : 'No emergency exits defined — mandatory for safety compliance.',
      fix: 'Add at least 2 emergency exits on opposite sides of the venue.',
    },
    {
      id: 's2', label: 'Minimum 2 emergency exits', severity: 'warning',
      pass: cnt('emergency_exit') >= 2,
      detail: cnt('emergency_exit') >= 2 ? 'Multiple emergency exits ensure redundant evacuation routes.' : `Only ${cnt('emergency_exit')} exit — single point of failure.`,
      fix: 'Add a second emergency exit on the far side of the venue.',
    },
    {
      id: 's3', label: 'Medical bay present', severity: 'warning',
      pass: has('medical'),
      detail: has('medical') ? 'Medical bay configured.' : 'No medical station — required for events over 500 attendees.',
      fix: 'Add a Medical Bay zone near the main stage.',
    },
    {
      id: 's4', label: 'Medical bay near stage', severity: 'warning',
      pass: (() => { const m = get('medical'); const s = get('stage'); return !m || !s || dist(m, s) <= 200; })(),
      detail: (() => { const m = get('medical'); const s = get('stage'); if (!m || !s) return 'N/A — medical or stage not defined.'; const d = dist(m, s); return d <= 200 ? `Medical bay is ${d}px from stage — good response distance.` : `Medical bay is ${d}px from stage — too far for rapid response.`; })(),
      fix: 'Move medical bay within 200px of the main stage.',
    },
    {
      id: 's5', label: 'Security / staff zones', severity: 'info',
      pass: has('security') || has('staff'),
      detail: has('security') || has('staff') ? 'Security/staff zones present.' : 'No security zones defined.',
      fix: 'Add security checkpoints near gates and stage.',
    },
  ];

  const access: Check[] = [
    {
      id: 'a1', label: 'Entrance gates present', severity: 'error',
      pass: has('gate'),
      detail: has('gate') ? `${cnt('gate')} gate(s) configured.` : 'No entrance gates — crowd cannot enter.',
      fix: 'Add at least 2 gate zones at the venue perimeter.',
    },
    {
      id: 'a2', label: 'Multiple gates for load distribution', severity: 'warning',
      pass: cnt('gate') >= 2,
      detail: cnt('gate') >= 2 ? `${cnt('gate')} gates allow crowd distribution.` : 'Single gate creates a bottleneck.',
      fix: 'Add Gate B on the opposite side to distribute entry load.',
    },
    {
      id: 'a3', label: 'Exit zones defined', severity: 'warning',
      pass: has('exit') || has('emergency_exit'),
      detail: has('exit') || has('emergency_exit') ? 'Exit zones configured.' : 'No exit zones — crowd flow analysis incomplete.',
      fix: 'Add at least one exit zone.',
    },
    {
      id: 'a4', label: 'Parking available', severity: 'info',
      pass: has('parking'),
      detail: has('parking') ? `${cnt('parking')} parking zone(s) — ${parkCap} spaces.` : 'No parking zones defined.',
      fix: 'Add parking zones if attendees are driving.',
    },
    {
      id: 'a5', label: 'Parking capacity ≥ 20% of venue', severity: 'warning',
      pass: !has('parking') || totalCap === 0 || parkCap >= totalCap * 0.2,
      detail: !has('parking') ? 'N/A — no parking defined.' : `Parking: ${parkCap} / Venue: ${totalCap} (${totalCap > 0 ? Math.round((parkCap / totalCap) * 100) : 0}%)`,
      fix: `Increase parking capacity to at least ${Math.round(totalCap * 0.2)} spaces.`,
    },
  ];

  const operations: Check[] = [
    {
      id: 'o1', label: 'Main stage defined', severity: 'info',
      pass: has('stage'),
      detail: has('stage') ? 'Main stage zone configured.' : 'No stage zone — crowd flow around performance area cannot be modelled.',
      fix: 'Add a Stage zone for the main performance area.',
    },
    {
      id: 'o2', label: 'Food & beverage zones', severity: 'info',
      pass: has('food'),
      detail: has('food') ? `${cnt('food')} food zone(s) configured.` : 'No food zones — crowd will cluster near stage.',
      fix: 'Add food court zones to distribute crowd density.',
    },
    {
      id: 'o3', label: 'Restroom facilities', severity: 'warning',
      pass: has('restroom'),
      detail: has('restroom') ? `${cnt('restroom')} restroom zone(s) configured.` : 'No restroom zones — queue prediction unavailable.',
      fix: 'Add restroom zones to enable wait-time predictions.',
    },
    {
      id: 'o4', label: 'VIP / premium areas', severity: 'info',
      pass: has('vip'),
      detail: has('vip') ? 'VIP zone configured.' : 'No VIP zone defined.',
      fix: 'Add a VIP zone if premium ticketing is offered.',
    },
    {
      id: 'o5', label: 'Total capacity ≥ 100', severity: 'warning',
      pass: totalCap >= 100,
      detail: `Total venue capacity: ${totalCap.toLocaleString()} people.`,
      fix: 'Review zone capacities — total seems low.',
    },
  ];

  const catScore = (checks: Check[]) => {
    const errors   = checks.filter(c => !c.pass && c.severity === 'error').length;
    const warnings = checks.filter(c => !c.pass && c.severity === 'warning').length;
    return Math.max(0, Math.min(100, 100 - errors * 25 - warnings * 10));
  };

  const categories: Category[] = [
    { id: 'safety',     label: 'Safety & Emergency', icon: '🚨', checks: safety,     score: catScore(safety)     },
    { id: 'access',     label: 'Access & Parking',   icon: '🚪', checks: access,     score: catScore(access)     },
    { id: 'operations', label: 'Operations',         icon: '⚙️', checks: operations, score: catScore(operations) },
  ];

  const overall = Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
  const grade   = overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F';
  const allChecks = [...safety, ...access, ...operations];

  return {
    categories, overall, grade,
    totalZones: zones.length,
    totalCapacity: totalCap,
    criticalCount: allChecks.filter(c => !c.pass && c.severity === 'error').length,
    warningCount:  allChecks.filter(c => !c.pass && c.severity === 'warning').length,
  };
}

const GRADE_COLOR: Record<string, string> = { A: '#00f5a0', B: '#00d4ff', C: '#fbbf24', D: '#fb923c', F: '#f43f5e' };
const SEV_CFG = {
  error:   { color: '#f43f5e', icon: <XCircle size={11} />,      label: 'CRITICAL' },
  warning: { color: '#fbbf24', icon: <AlertTriangle size={11} />, label: 'WARNING'  },
  info:    { color: '#00d4ff', icon: <Info size={11} />,          label: 'INFO'     },
};

function scoreColor(s: number) { return s >= 90 ? '#00f5a0' : s >= 75 ? '#00d4ff' : s >= 60 ? '#fbbf24' : s >= 40 ? '#fb923c' : '#f43f5e'; }

interface Props { zones: Zone[]; onClose: () => void }

export default function AIVenueValidator({ zones, onClose }: Props) {
  const [running, setRunning]   = useState(false);
  const [report,  setReport]    = useState<Report | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const run = () => {
    setRunning(true); setReport(null);
    setTimeout(() => { setReport(buildReport(zones)); setRunning(false); }, 1600);
  };

  const exportReport = () => {
    if (!report) return;
    const lines = [
      'AI VENUE VALIDATION REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Overall Score: ${report.overall}/100  Grade: ${report.grade}`,
      `Zones: ${report.totalZones}  Capacity: ${report.totalCapacity}  Errors: ${report.criticalCount}  Warnings: ${report.warningCount}`,
      '',
      ...report.categories.flatMap(cat => [
        `--- ${cat.label} (${cat.score}/100) ---`,
        ...cat.checks.map(c => `[${c.pass ? 'PASS' : c.severity.toUpperCase()}] ${c.label}: ${c.detail}${!c.pass && c.fix ? ` FIX: ${c.fix}` : ''}`),
        '',
      ]),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'venue-validation-report.txt'; a.click();
  };

  const gc = report ? GRADE_COLOR[report.grade] : '#00d4ff';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'rgba(6,12,24,0.99)', border: '1px solid rgba(0,212,255,0.18)', boxShadow: '0 0 80px rgba(0,212,255,0.08), 0 40px 100px rgba(0,0,0,0.8)', maxHeight: '88vh' }}>

        <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,#00d4ff,transparent)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)' }}>
              <Shield size={15} style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">AI Venue Validation Report</p>
              <p className="text-[10px] text-white/30 mt-0.5">{zones.length} zones · Safety, access & operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Download size={11} /> Export
              </button>
            )}
            <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={15} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Idle */}
          {!report && !running && (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🏟️</div>
              <p className="text-[13px] text-white/50 mb-1">Ready to analyse your venue layout</p>
              <p className="text-[11px] text-white/25 mb-6">Checks safety compliance, access flow, and operational readiness across {zones.length} zones</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={run}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold mx-auto"
                style={{ background: 'linear-gradient(135deg,#00d4ff,#0088cc)', color: '#020409', boxShadow: '0 0 28px rgba(0,212,255,0.3)' }}>
                <Zap size={14} /> Run AI Validation
              </motion.button>
            </div>
          )}

          {/* Running */}
          {running && (
            <div className="text-center py-12">
              <motion.div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-4"
                animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              <p className="text-[13px] text-white/50">Analysing venue layout…</p>
              <p className="text-[10px] text-white/25 mt-1">Checking safety, access, capacity & operations</p>
            </div>
          )}

          <AnimatePresence>
            {report && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Overall score banner */}
                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: `${gc}08`, border: `1px solid ${gc}22` }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${gc}12`, border: `2px solid ${gc}35` }}>
                    <span className="text-3xl font-black" style={{ color: gc }}>{report.grade}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-[18px] font-black text-white">{report.overall}</span>
                      <span className="text-[11px] text-white/30">/ 100</span>
                      <span className="text-[10px] font-semibold ml-auto" style={{ color: gc }}>
                        {report.overall >= 90 ? 'EXCELLENT' : report.overall >= 75 ? 'GOOD' : report.overall >= 60 ? 'FAIR' : report.overall >= 40 ? 'POOR' : 'CRITICAL'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${report.overall}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                        style={{ background: `linear-gradient(90deg,${gc}70,${gc})` }} />
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-white/40">{report.totalZones} zones</span>
                      <span className="text-white/40">{report.totalCapacity.toLocaleString()} capacity</span>
                      {report.criticalCount > 0 && <span style={{ color: '#f43f5e' }}>● {report.criticalCount} critical</span>}
                      {report.warningCount  > 0 && <span style={{ color: '#fbbf24' }}>● {report.warningCount} warnings</span>}
                      {report.criticalCount === 0 && report.warningCount === 0 && <span style={{ color: '#00f5a0' }}>● All checks passed</span>}
                    </div>
                  </div>
                </div>

                {/* Category cards */}
                {report.categories.map((cat, ci) => {
                  const sc = scoreColor(cat.score);
                  const isOpen = expanded === cat.id;
                  const fails = cat.checks.filter(c => !c.pass);
                  return (
                    <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.08 }}
                      className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      {/* Category header */}
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                        style={{ background: 'rgba(255,255,255,0.02)' }} onClick={() => setExpanded(isOpen ? null : cat.id)}>
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-[12px] font-bold text-white flex-1">{cat.label}</span>
                        <div className="flex items-center gap-2">
                          {fails.length > 0 && <span className="text-[10px] text-white/30">{fails.length} issue{fails.length > 1 ? 's' : ''}</span>}
                          <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <div className="h-full rounded-full" style={{ width: `${cat.score}%`, background: sc }} />
                          </div>
                          <span className="text-[11px] font-bold w-8 text-right" style={{ color: sc }}>{cat.score}</span>
                          <span className="text-white/20 text-[10px] ml-1">{isOpen ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Checks list */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-4 pb-3 space-y-2 pt-1">
                              {cat.checks.map((chk, i) => {
                                const sev = SEV_CFG[chk.severity];
                                return (
                                  <motion.div key={chk.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                                    className="flex items-start gap-2.5 p-2.5 rounded-lg"
                                    style={{ background: chk.pass ? 'rgba(0,245,160,0.04)' : `rgba(${chk.severity === 'error' ? '244,63,94' : chk.severity === 'warning' ? '251,191,36' : '0,212,255'},0.05)`, border: `1px solid ${chk.pass ? 'rgba(0,245,160,0.12)' : `rgba(${chk.severity === 'error' ? '244,63,94' : chk.severity === 'warning' ? '251,191,36' : '0,212,255'},0.15)`}` }}>
                                    <span className="flex-shrink-0 mt-0.5" style={{ color: chk.pass ? '#00f5a0' : sev.color }}>
                                      {chk.pass ? <CheckCircle size={11} /> : sev.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[11px] font-semibold text-white/80">{chk.label}</span>
                                        {!chk.pass && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${sev.color}20`, color: sev.color }}>{sev.label}</span>}
                                      </div>
                                      <p className="text-[10px] text-white/40 leading-relaxed">{chk.detail}</p>
                                      {!chk.pass && chk.fix && (
                                        <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#00d4ff99' }}>
                                          <span className="font-semibold" style={{ color: '#00d4ff' }}>Fix: </span>{chk.fix}
                                        </p>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {/* Re-run */}
                <button onClick={run} className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-white/35 hover:text-white/60 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
