import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Volume2, VolumeX, Wifi, WifiOff, Sun, Moon, Download } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { riskBg } from '../../utils/helpers';

export default function Navbar() {
  const { kpi, alerts, isMuted, toggleMute, isDarkMode, toggleDarkMode, notifications } = useEventStore();
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(true);
  const unreadAlerts = alerts.filter(a => !a.read && !a.dismissed).length;
  const unreadNotifs = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const weather = '24°C ⛅';

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-md border-b border-white/8 flex items-center px-4 lg:px-6 gap-4 flex-shrink-0 z-10">
      {/* Event info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-green-400 tracking-wider font-mono">LIVE</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold text-white leading-tight truncate">Coldplay — Music of the Spheres</p>
          <p className="text-[11px] text-white/40">Organized by LiveNation · Arena Central</p>
        </div>
        <div className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${riskBg(kpi.riskLevel)}`}>
          <span className="capitalize">{kpi.riskLevel}</span> Risk
        </div>
      </div>

      {/* Center stats */}
      <div className="hidden lg:flex items-center gap-6 text-center">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Crowd</p>
          <motion.p key={kpi.currentCrowd} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-sm font-bold text-white font-mono">{kpi.currentCrowd.toLocaleString()}</motion.p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Occupancy</p>
          <motion.p key={kpi.occupancyPercent} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className={`text-sm font-bold font-mono ${kpi.occupancyPercent >= 80 ? 'text-orange-400' : 'text-green-400'}`}>
            {kpi.occupancyPercent}%
          </motion.p>
        </div>
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Time</p>
          <p className="text-sm font-bold text-cyan-400 font-mono">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
        </div>
        <div className="hidden xl:block">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Weather</p>
          <p className="text-sm font-bold text-white">{weather}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Network */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${online ? 'text-green-400' : 'text-red-400'}`}>
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </div>

        {/* Mute */}
        <button onClick={toggleMute}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute alerts'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Dark mode */}
        <button onClick={toggleDarkMode}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Alerts bell */}
        <button className="relative w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
          <Bell size={14} />
          <AnimatePresence>
            {(unreadAlerts + unreadNotifs) > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadAlerts + unreadNotifs > 9 ? '9+' : unreadAlerts + unreadNotifs}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Export */}
        <button className="hidden sm:flex items-center gap-1.5 h-8 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
          <Download size={12} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
