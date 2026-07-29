import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Check, X, Bell } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatTimeAgo } from '../../utils/helpers';

const typeColors: Record<string, string> = {
  info:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  success: 'text-green-400 bg-green-500/10 border-green-500/20',
  error:   'text-red-400 bg-red-500/10 border-red-500/20',
};

type FilterTab = 'all' | 'unread' | 'pinned';

export default function NotificationCenter() {
  const { notifications, addNotification } = useEventStore();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [localNotifs, setLocalNotifs] = useState(notifications);

  // Seed some notifications if empty
  const seeded = localNotifs.length > 0 ? localNotifs : [
    { id: 'n1', title: 'Gate C Opened', message: 'Gate Agent successfully opened Gate C following Orchestrator directive.', type: 'success' as const, timestamp: new Date(Date.now() - 15*60000), read: false, pinned: true,  priority: 1 },
    { id: 'n2', title: 'Food Court Warning', message: 'Food Court occupancy at 87%. Overflow predicted in 4 minutes.', type: 'warning' as const, timestamp: new Date(Date.now() - 8*60000),  read: false, pinned: false, priority: 2 },
    { id: 'n3', title: 'Duplicate Ticket Blocked', message: 'Ticket Agent blocked 2 duplicate QR scans at Gate A.', type: 'info' as const, timestamp: new Date(Date.now() - 22*60000), read: true,  pinned: false, priority: 3 },
    { id: 'n4', title: 'Analytics Report Ready', message: 'Hourly crowd analysis report generated. 8 insights identified.', type: 'info' as const, timestamp: new Date(Date.now() - 30*60000), read: true,  pinned: false, priority: 4 },
    { id: 'n5', title: 'Parking A Alert', message: 'Parking A reached 84% capacity. Vehicles being routed to Lot B.', type: 'warning' as const, timestamp: new Date(Date.now() - 45*60000), read: true,  pinned: false, priority: 5 },
  ];

  const displayed = seeded.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'pinned') return n.pinned;
    return true;
  });

  const markRead = (id: string) => setLocalNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss  = (id: string) => setLocalNotifs(ns => ns.filter(n => n.id !== id));
  const pin      = (id: string) => setLocalNotifs(ns => ns.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));

  const tabs: FilterTab[] = ['all', 'unread', 'pinned'];
  const counts: Record<FilterTab, number> = {
    all:    seeded.length,
    unread: seeded.filter(n => !n.read).length,
    pinned: seeded.filter(n => n.pinned).length,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-white/60" />
          <span className="text-sm font-semibold text-white">Notifications</span>
        </div>
        <div className="flex bg-white/5 rounded-xl p-0.5">
          {tabs.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${filter === t ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}>
              {t} {counts[t] > 0 && <span className="ml-1 text-[9px] opacity-60">({counts[t]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {displayed.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${!n.read ? 'bg-white/3' : ''}`}>
              <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-cyan-400' : 'bg-white/15'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold mb-0.5 ${!n.read ? 'text-white' : 'text-white/70'}`}>{n.title}</p>
                <p className="text-xs text-white/45 leading-snug">{n.message}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${typeColors[n.type]} font-semibold uppercase`}>{n.type}</span>
                  <span className="text-[10px] text-white/25">{formatTimeAgo(n.timestamp)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => pin(n.id)} title={n.pinned ? 'Unpin' : 'Pin'}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${n.pinned ? 'text-yellow-400' : 'text-white/25 hover:text-white/70'}`}>
                  <Pin size={10} />
                </button>
                <button onClick={() => markRead(n.id)} title="Mark read"
                  className="w-5 h-5 rounded flex items-center justify-center text-white/25 hover:text-green-400 transition-colors">
                  <Check size={10} />
                </button>
                <button onClick={() => dismiss(n.id)}
                  className="w-5 h-5 rounded flex items-center justify-center text-white/25 hover:text-white/70 transition-colors">
                  <X size={10} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {displayed.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-white/25">
            <Bell size={24} />
            <p className="text-sm">No {filter} notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
