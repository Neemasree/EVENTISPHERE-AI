import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '../../store/eventStore';
import { riskColor } from '../../utils/helpers';

export default function Navbar() {
  const { kpi, alerts, isMuted, toggleMute, notifications } = useEventStore();
  const [time, setTime] = useState(new Date());

  const navigate = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed).length;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const totalUnread  = unreadAlerts + unreadNotifs;
  const riskC        = riskColor(kpi.riskLevel);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="flex items-center px-5 gap-4 flex-shrink-0 z-10 relative"
      style={{
        height: '56px',
        background: 'rgba(6,12,22,0.85)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left — event name + live dot */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span className="live-dot flex-shrink-0" />
        <p className="text-[13px] font-semibold text-white truncate leading-none">
          Summer Music Festival
        </p>
        <span className="text-[10px] text-white/30 hidden sm:block flex-shrink-0">· Arena Central</span>
      </div>

      {/* Center — risk pill + crowd count */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
          style={{ background: `${riskC}15`, border: `1px solid ${riskC}35`, color: riskC }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskC }} />
          {kpi.riskLevel} risk
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold"
          style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', color: '#00d4ff' }}>
          {kpi.currentCrowd.toLocaleString()} visitors
        </div>
      </div>

      {/* Right — clock + mute + bell */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="hidden lg:block text-[12px] font-mono text-white/35 px-2">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>

        <button onClick={toggleMute} className="btn-icon" title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX size={14} className="text-white/40" /> : <Volume2 size={14} />}
        </button>

        <button className="btn-icon relative" onClick={() => navigate('/notifications')}>
          <Bell size={14} />
          <AnimatePresence>
            {totalUnread > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="absolute -top-1 -right-1 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.7)' }}>
                {totalUnread > 9 ? '9+' : totalUnread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
