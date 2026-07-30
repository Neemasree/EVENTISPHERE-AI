import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface ActivityEvent {
  id: string;
  zone: 'A' | 'B';
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  count?: number;
}

const TYPE_CFG = {
  info:     { color: '#6366f1', bg: 'rgba(99,102,241,0.09)',  border: 'rgba(99,102,241,0.25)',  dot: '#818cf8' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.22)',  dot: '#fbbf24' },
  critical: { color: '#f43f5e', bg: 'rgba(244,63,94,0.09)',   border: 'rgba(244,63,94,0.28)',   dot: '#f87171' },
};

interface Props {
  events: ActivityEvent[];
  open: boolean;
  onClose: () => void;
}

export default function ActivityDrawer({ events, open, onClose }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events, open]);

  const latest = events[events.length - 1];
  const latestColor = latest ? TYPE_CFG[latest.type].color : '#6366f1';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto rounded-t-3xl overflow-hidden"
            style={{
              maxWidth: 700,
              background: 'rgba(6,12,24,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              boxShadow: `0 -20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)`,
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* Top accent */}
            <div className="h-0.5 w-full"
              style={{ background: `linear-gradient(90deg, transparent, ${latestColor}, transparent)` }} />

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2.5">
                <span className="live-dot w-2 h-2" />
                <p className="text-[13px] font-bold text-white">Live Activity Feed</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                  style={{ background: `${latestColor}18`, color: latestColor, border: `1px solid ${latestColor}35` }}>
                  {events.length}
                </span>
              </div>
              <button onClick={onClose} className="btn-icon w-7 h-7 rounded-xl">
                <X size={13} />
              </button>
            </div>

            {/* Feed */}
            <div className="overflow-y-auto p-3 space-y-1.5" style={{ maxHeight: '50vh' }}>
              <AnimatePresence mode="popLayout">
                {events.length === 0 && (
                  <p className="text-[12px] text-white/30 text-center py-8">No activity yet</p>
                )}
                {[...events].reverse().map(ev => {
                  const cfg = TYPE_CFG[ev.type];
                  return (
                    <motion.div
                      key={ev.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ background: cfg.dot, boxShadow: `0 0 5px ${cfg.dot}` }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: `${cfg.color}18`, color: cfg.color }}>
                            LOT {ev.zone}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider"
                            style={{ color: cfg.color }}>{ev.type}</span>
                          <span className="text-[9px] font-mono text-white/25 ml-auto">
                            {new Date(ev.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/65 leading-snug">{ev.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={endRef} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
