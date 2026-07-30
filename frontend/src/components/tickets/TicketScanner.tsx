import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Scan, Wifi, AlertTriangle, KeyRound, Send, Clock, BadgeCheck } from 'lucide-react';
import { useEventStore, verifyTicket } from '../../store/eventStore';

type ScanStatus = 'verified' | 'duplicate' | 'rejected';
type RequestStatus = 'idle' | 'pending' | 'approved' | 'denied';

interface ScanResult {
  id: string;
  ticketId: string;
  status: ScanStatus;
  gate: string;
  timestamp: Date;
  reason: string;
}

interface AccessRequest {
  id: string;
  ticketId: string;
  name: string;
  reason: string;
  status: RequestStatus;
  timestamp: Date;
  responseTime?: number;
}

const STATUS_CFG: Record<ScanStatus, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  verified:  { color: '#00f5a0', bg: 'rgba(0,245,160,0.08)',  border: 'rgba(0,245,160,0.25)',  icon: CheckCircle,   label: 'ENTRY GRANTED'       },
  duplicate: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.35)',  icon: XCircle,       label: 'DUPLICATE — REJECTED' },
  rejected:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', icon: AlertTriangle, label: 'TICKET REJECTED'      },
};

const REQ_CFG: Record<RequestStatus, { color: string; bg: string; border: string; label: string }> = {
  idle:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  label: 'Pending'  },
  pending:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', label: 'Reviewing' },
  approved: { color: '#00f5a0', bg: 'rgba(0,245,160,0.08)',  border: 'rgba(0,245,160,0.25)',  label: 'Approved' },
  denied:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.25)',  label: 'Denied'   },
};

function simulateAccessDecision(ticketId: string): RequestStatus {
  const { outcome } = verifyTicket(ticketId);
  if (outcome === 'rejected') return 'denied';
  if (outcome === 'duplicate') return 'denied';
  return 'approved';
}

export default function TicketScanner() {
  const { simulateNextScan, ticketScanFeed } = useEventStore();
  const [current,  setCurrent]  = useState<ScanResult | null>(null);
  const [history,  setHistory]  = useState<ScanResult[]>([]);

  // Access request state
  const [reqForm,    setReqForm]    = useState({ ticketId: '', name: '', reason: '' });
  const [reqError,   setReqError]   = useState('');
  const [requests,   setRequests]   = useState<AccessRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const stats = {
    total:    history.length,
    verified: history.filter(h => h.status === 'verified').length,
    rejected: history.filter(h => h.status !== 'verified').length,
  };

  useEffect(() => {
    if (ticketScanFeed.length === 0) return;
    const latest = ticketScanFeed[0];
    const result: ScanResult = {
      id: latest.id, ticketId: latest.ticketId, status: latest.status,
      gate: latest.gate, timestamp: latest.timestamp, reason: latest.reason,
    };
    setCurrent(result);
    setHistory(prev => [result, ...prev.slice(0, 9)]);
  }, [ticketScanFeed]);

  const handleRequestSubmit = () => {
    if (!reqForm.ticketId.trim()) return setReqError('Ticket ID is required.');
    if (!reqForm.name.trim())     return setReqError('Name is required.');
    setReqError('');
    setSubmitting(true);

    const newReq: AccessRequest = {
      id: `req_${Date.now()}`,
      ticketId: reqForm.ticketId.trim().toUpperCase(),
      name: reqForm.name.trim(),
      reason: reqForm.reason.trim(),
      status: 'pending',
      timestamp: new Date(),
    };
    setRequests(prev => [newReq, ...prev]);
    setReqForm({ ticketId: '', name: '', reason: '' });
    setSubmitting(false);

    // Simulate AI review after 2s
    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      const decision = simulateAccessDecision(newReq.ticketId);
      setRequests(prev => prev.map(r =>
        r.id === newReq.id
          ? { ...r, status: decision, responseTime: Math.round(delay / 1000) }
          : r
      ));
    }, delay);
  };

  return (
    <div className="space-y-5">

      {/* ── Scanner display ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)' }}>
              <Scan size={15} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Ticket Verification System</p>
              <p className="text-[10px] text-white/30 mt-0.5 font-mono">AI-powered QR scanner · Gate Agent active</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi size={11} className="text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-400">Connected</span>
          </div>
        </div>

        <div className="p-5 flex flex-col lg:flex-row gap-6">
          {/* QR Scanner box */}
          <div className="flex-shrink-0">
            <div className="relative w-52 h-52 mx-auto rounded-2xl overflow-hidden"
              style={{ background: '#040810', border: '1px solid rgba(96,165,250,0.2)' }}>
              {['top-2 left-2 border-t-2 border-l-2','top-2 right-2 border-t-2 border-r-2',
                'bottom-2 left-2 border-b-2 border-l-2','bottom-2 right-2 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 rounded-sm ${cls}`} style={{ borderColor: '#60a5fa' }} />
              ))}
              <div className="absolute inset-8 grid grid-cols-5 grid-rows-5 gap-1 opacity-20">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="rounded-sm"
                    style={{ background: Math.random() > 0.4 ? '#60a5fa' : 'transparent' }} />
                ))}
              </div>
              <AnimatePresence>
                {current && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{ background: `${STATUS_CFG[current.status].color}15` }}>
                    {(() => { const Icon = STATUS_CFG[current.status].icon; return <Icon size={40} style={{ color: STATUS_CFG[current.status].color }} />; })()}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute bottom-3 inset-x-3 text-center">
                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.p key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-[10px] font-mono font-bold tracking-wider"
                      style={{ color: STATUS_CFG[current.status].color }}>
                      {STATUS_CFG[current.status].label}
                    </motion.p>
                  ) : (
                    <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-[9px] font-mono text-white/25 tracking-wider">READY TO SCAN</motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }} className="mt-4 p-3.5 rounded-xl"
                  style={{ background: STATUS_CFG[current.status].bg, border: `1px solid ${STATUS_CFG[current.status].border}` }}>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => { const Icon = STATUS_CFG[current.status].icon; return <Icon size={13} style={{ color: STATUS_CFG[current.status].color }} />; })()}
                    <span className="text-[11px] font-bold" style={{ color: STATUS_CFG[current.status].color }}>
                      {STATUS_CFG[current.status].label}
                    </span>
                  </div>
                  {current.status === 'verified' ? (
                    <div className="space-y-1">
                      <p className="text-[12px] font-semibold text-white">{current.ticketId}</p>
                      <p className="text-[10px] font-mono text-white/40">{current.gate}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[11px] text-white/60">{current.ticketId}</p>
                      <p className="text-[10px] text-white/35">
                        {current.status === 'duplicate' ? 'Security notified' : 'Ticket not found in system'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: stats + controls + history */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Scanned',  value: stats.total,    color: '#00d4ff' },
                { label: 'Verified', value: stats.verified, color: '#00f5a0' },
                { label: 'Rejected', value: stats.rejected, color: '#f43f5e' },
              ].map(s => (
                <div key={s.label} className="text-center py-3 rounded-xl"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
                  <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => simulateNextScan()}
              className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #60a5fa, #3b82f6)', color: '#020409', boxShadow: '0 0 20px rgba(96,165,250,0.3)' }}>
              <Scan size={15} /> Simulate Scan
            </motion.button>

            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-bold">Recent Scans</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {history.map(scan => {
                    const cfg = STATUS_CFG[scan.status];
                    const Icon = cfg.icon;
                    return (
                      <motion.div key={scan.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Icon size={11} style={{ color: cfg.color, flexShrink: 0 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-white/80 truncate">{scan.ticketId}</p>
                          <p className="text-[9px] font-mono text-white/30">{scan.gate}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase" style={{ color: cfg.color, flexShrink: 0 }}>
                          {scan.status === 'verified' ? '✓' : '✗'}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {history.length === 0 && (
                  <p className="text-[11px] text-white/20 text-center py-4">No scans yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Request Access by Ticket ID ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

        <div className="flex items-center gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)' }}>
            <KeyRound size={15} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Request Access</p>
            <p className="text-[10px] text-white/30 mt-0.5">Submit your ticket ID to request entry — AI reviews instantly</p>
          </div>
        </div>

        <div className="p-5 flex flex-col lg:flex-row gap-6">
          {/* Form */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Ticket ID *</p>
                <input
                  value={reqForm.ticketId}
                  onChange={e => setReqForm(p => ({ ...p, ticketId: e.target.value }))}
                  placeholder="e.g. EVT-2024-15420"
                  className="input-field text-sm w-full font-mono"
                />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Full Name *</p>
                <input
                  value={reqForm.name}
                  onChange={e => setReqForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. John Smith"
                  className="input-field text-sm w-full"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">Reason (optional)</p>
              <input
                value={reqForm.reason}
                onChange={e => setReqForm(p => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. Lost QR code, late arrival..."
                className="input-field text-sm w-full"
              />
            </div>

            {reqError && (
              <p className="text-[11px] px-3 py-2 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
                ⚠ {reqError}
              </p>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleRequestSubmit} disabled={submitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', boxShadow: '0 0 16px rgba(168,85,247,0.3)' }}>
              <Send size={13} /> Submit Request
            </motion.button>
          </div>

          {/* Request history */}
          <div className="lg:w-72 flex-shrink-0">
            <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-bold">Access Requests</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {requests.map(req => {
                  const cfg = REQ_CFG[req.status];
                  return (
                    <motion.div key={req.id} layout initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-bold text-white/80">{req.ticketId}</span>
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                          {req.status === 'pending' && <Clock size={9} />}
                          {req.status === 'approved' && <BadgeCheck size={9} />}
                          {req.status === 'denied' && <XCircle size={9} />}
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50">{req.name}</p>
                      {req.reason && <p className="text-[9px] text-white/30 mt-0.5 truncate">{req.reason}</p>}
                      {req.responseTime && (
                        <p className="text-[9px] text-white/20 mt-1 font-mono">AI reviewed in {req.responseTime}s</p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {requests.length === 0 && (
                <p className="text-[11px] text-white/20 text-center py-6">No requests yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
