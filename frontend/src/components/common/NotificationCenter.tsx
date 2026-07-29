import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Check, X, BellRing, CheckCircle } from 'lucide-react';
import { formatTimeAgo } from '../../utils/helpers';

const typeConfig: Record<string, { color: string; bg: string; border: string }> = {
  info:    { color: '#00d4ff', bg: 'rgba(0,212,255,0.07)',  border: 'rgba(0,212,255,0.18)'  },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.18)' },
  success: { color: '#00f5a0', bg: 'rgba(0,245,160,0.07)',  border: 'rgba(0,245,160,0.18)'  },
  error:   { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.22)'  },
};

type FilterTab = 'all' | 'unread' | 'pinned';

const seedNotifs = [
  { id: 'n1', title: 'Gate C Opened', message: 'Gate Agent successfully opened Gate C following Orchestrator directive.', type: 'success', timestamp: new Date(Date.now() - 15*60000), read: false, pinned: true,  priority: 1 },
  { id: 'n2', title: 'Food Court Warning', message: 'Food Court occupancy at 87%. Overflow predicted in 4 minutes.', type: 'warning', timestamp: new Date(Date.now() - 8*60000),  read: false, pinned: false, priority: 2 },
  { id: 'n3', title: 'Duplicate Ticket Blocked', message: 'Ticket Agent blocked 2 duplicate QR scans at Gate A.', type: 'info', timestamp: new Date(Date.now() - 22*60000), read: true,  pinned: false, priority: 3 },
  { id: 'n4', title: 'Analytics Report Ready', message: 'Hourly crowd analysis report generated. 8 insights identified.', type: 'info', timestamp: new Date(Date.now() - 30*60000), read: true,  pinned: false, priority: 4 },
  { id: 'n5', title: 'Parking A Alert', message: 'Parking A reached 84% capacity. Vehicles being routed to Lot B.', type: 'warning', timestamp: new Date(Date.now() - 45*60000), read: true,  pinned: false, priority: 5 },
];

export default function NotificationCenter() {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [notifs, setNotifs] = useState(seedNotifs);

  const displayed = notifs.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'pinned') return n.pinned;
    return true;
  });

  const counts: Record<FilterTab, number> = {
    all:    notifs.length,
    unread: notifs.filter(n => !n.read).length,
    pinned: notifs.filter(n => n.pinned).length,
  };

  const markRead = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss  = (id: string) => setNotifs(ns => ns.filter(n => n.id !== id));
  const pin      = (id: string) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <BellRing size={13} style={{ color: '#00d4ff' }} />
          </div>
          <p className="text-[13px] font-bold text-white">Notifications</p>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1 p-0.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {(['all', 'unread', 'pinned'] as FilterTab[]).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all duration-200"
              style={filter === t ? {
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
              } : {
                color: 'rgba(255,255,255,0.35)',
              }}>
              {t}
              {counts[t] > 0 && (
                <span className="ml-1.5 text-[9px] opacity-60">({counts[t]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[520px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {displayed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-14">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <CheckCircle size={20} style={{ color: '#00d4ff' }} />
              </div>
              <p className="text-sm text-white/40">No {filter} notifications</p>
            </motion.div>
          ) : (
            displayed.map((n, i) => {
              const cfg = typeConfig[n.type] ?? typeConfig.info;
              return (
                <motion.div key={n.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-white/3 group"
                  style={{
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: !n.read ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}>

                  {/* Unread dot */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: !n.read ? cfg.color : 'rgba(255,255,255,0.1)',
                        boxShadow: !n.read ? `0 0 5px ${cfg.color}` : 'none',
                      }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] font-semibold mb-1 leading-tight ${!n.read ? 'text-white' : 'text-white/65'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-white/40 leading-snug mb-2">{n.message}</p>
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {n.type}
                      </span>
                      <span className="text-[10px] text-white/25">{formatTimeAgo(n.timestamp)}</span>
                      {n.pinned && (
                        <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-0.5">
                          <Pin size={8} /> Pinned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => pin(n.id)} title={n.pinned ? 'Unpin' : 'Pin'}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: n.pinned ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                      <Pin size={11} />
                    </button>
                    <button onClick={() => markRead(n.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-emerald-400 transition-colors">
                      <Check size={11} />
                    </button>
                    <button onClick={() => dismiss(n.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 transition-colors">
                      <X size={11} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
