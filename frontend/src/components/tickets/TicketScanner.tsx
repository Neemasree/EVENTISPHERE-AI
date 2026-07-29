import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Scan, Wifi, AlertTriangle } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

type ScanStatus = 'verified' | 'duplicate' | 'rejected';

interface ScanResult {
  id: string;
  ticketId: string;
  status: ScanStatus;
  gate: string;
  timestamp: Date;
  reason: string;
}

const STATUS_CFG: Record<ScanStatus, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  verified:  { color: '#00f5a0', bg: 'rgba(0,245,160,0.08)',  border: 'rgba(0,245,160,0.25)',  icon: CheckCircle, label: 'ENTRY GRANTED'    },
  duplicate: { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.35)',  icon: XCircle,     label: 'DUPLICATE — REJECTED' },
  rejected:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', icon: AlertTriangle,label: 'TICKET REJECTED'  },
};

export default function TicketScanner() {
  const { simulateNextScan, ticketScanFeed } = useEventStore();
  const [current,  setCurrent]  = useState<ScanResult | null>(null);
  const [history,  setHistory]  = useState<ScanResult[]>([]);

  const stats = {
    total:      history.length,
    verified:   history.filter(h => h.status === 'verified').length,
    rejected:   history.filter(h => h.status !== 'verified').length,
  };

  useEffect(() => {
    if (ticketScanFeed.length === 0) return;
    const latest = ticketScanFeed[0];
    const result: ScanResult = {
      id: latest.id,
      ticketId: latest.ticketId,
      status: latest.status,
      gate: latest.gate,
      timestamp: latest.timestamp,
      reason: latest.reason,
    };
    setCurrent(result);
    setHistory(prev => [result, ...prev.slice(0, 9)]);
  }, [ticketScanFeed]);

  const handleSimulate = () => {
    simulateNextScan();
  };

  return (
    <div className="space-y-5">

      {/* Scanner display */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>

        {/* Header */}
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
          {/* QR Scanner box (decorative) */}
          <div className="flex-shrink-0">
            <div className="relative w-52 h-52 mx-auto rounded-2xl overflow-hidden"
              style={{ background: '#040810', border: '1px solid rgba(96,165,250,0.2)' }}>
              {/* Corner brackets */}
              {[
                'top-2 left-2 border-t-2 border-l-2',
                'top-2 right-2 border-t-2 border-r-2',
                'bottom-2 left-2 border-b-2 border-l-2',
                'bottom-2 right-2 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-6 h-6 rounded-sm ${cls}`}
                  style={{ borderColor: '#60a5fa' }} />
              ))}

              {/* QR pattern (decorative) */}
              <div className="absolute inset-8 grid grid-cols-5 grid-rows-5 gap-1 opacity-20">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="rounded-sm"
                    style={{
                      background: Math.random() > 0.4 ? '#60a5fa' : 'transparent',
                    }} />
                ))}
              </div>

              {/* Result overlay */}
              <AnimatePresence>
                {current && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center rounded-2xl"
                    style={{ background: `${STATUS_CFG[current.status].color}15` }}
                  >
                    {(() => {
                      const cfg = STATUS_CFG[current.status];
                      const Icon = cfg.icon;
                      return (
                        <div className="flex flex-col items-center gap-2">
                          <Icon size={40} style={{ color: cfg.color }} />
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status label */}
              <div className="absolute bottom-3 inset-x-3 text-center">
                <AnimatePresence mode="wait">
                  {current ? (
                    <motion.p key="result"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-[10px] font-mono font-bold tracking-wider"
                      style={{ color: STATUS_CFG[current.status].color }}>
                      {STATUS_CFG[current.status].label}
                    </motion.p>
                  ) : (
                    <motion.p key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="text-[9px] font-mono text-white/25 tracking-wider">
                      READY TO SCAN
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Scan result card */}
            <AnimatePresence mode="wait">
              {current && (
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 p-3.5 rounded-xl"
                  style={{
                    background: STATUS_CFG[current.status].bg,
                    border: `1px solid ${STATUS_CFG[current.status].border}`,
                  }}
                >
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
            {/* Stats */}
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

            {/* Controls */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={handleSimulate}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  color: '#020409',
                  boxShadow: '0 0 20px rgba(96,165,250,0.3)',
                }}>
                <Scan size={15} />
                Simulate Scan
              </motion.button>
            </div>

            {/* Scan history */}
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest mb-2 font-bold">Recent Scans</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {history.map(scan => {
                    const cfg = STATUS_CFG[scan.status];
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={scan.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
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
    </div>
  );
}