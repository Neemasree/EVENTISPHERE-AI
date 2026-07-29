import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MapPin, Flame, Users, Bell, BarChart3,
  Bot, Zap, Clock, BellRing, AlertTriangle, Play,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard',       group: 'main' },
  { to: '/venue',         icon: MapPin,           label: 'Digital Twin',    group: 'main' },
  { to: '/heatmap',       icon: Flame,            label: 'Heatmap',         group: 'main' },
  { to: '/crowd',         icon: Users,            label: 'Crowd Intel',     group: 'main' },
  { to: '/agents',        icon: Bot,              label: 'Agents',          group: 'ai' },
  { to: '/simulator',     icon: Zap,              label: 'Simulator',       group: 'ai' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics',       group: 'insights' },
  { to: '/timeline',      icon: Clock,            label: 'AI Timeline',     group: 'insights' },
  { to: '/replay',        icon: Play,             label: 'Event Replay',    group: 'insights' },
  { to: '/alerts',        icon: Bell,             label: 'Alerts',          group: 'ops', badge: 'alerts' },
  { to: '/notifications', icon: BellRing,         label: 'Notifications',   group: 'ops' },
  { to: '/incidents',     icon: AlertTriangle,    label: 'Incidents',       group: 'ops' },
];

const groups: Record<string, string> = { main: 'OVERVIEW', ai: 'AI AGENTS', insights: 'INSIGHTS', ops: 'OPERATIONS' };

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useEventStore();
  const unread = alerts.filter(a => !a.read && !a.dismissed).length;
  const location = useLocation();

  const grouped = ['main', 'ai', 'insights', 'ops'];

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex-shrink-0 bg-dark-800 border-r border-white/8 flex flex-col h-full overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/8 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-bold text-white leading-tight">EventSphere</p>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest">AI PLATFORM</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {grouped.map(group => (
          <div key={group}>
            {sidebarOpen && (
              <p className="text-[9px] font-semibold tracking-widest text-white/30 px-3 pt-3 pb-1 uppercase">{groups[group]}</p>
            )}
            {navItems.filter(i => i.group === group).map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              const badgeCount = item.badge === 'alerts' ? unread : 0;
              return (
                <NavLink key={item.to} to={item.to}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                      ${isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-white/50 hover:text-white/90 hover:bg-white/5'
                      }`}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && (
                      <motion.div layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-full"
                        style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }}
                      />
                    )}
                    {badgeCount > 0 && (
                      <span className={`ml-auto flex-shrink-0 ${sidebarOpen ? '' : 'absolute top-1 right-1'} bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center`}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-10 border-t border-white/8 text-white/40 hover:text-white/80 transition-colors"
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </motion.aside>
  );
}
