import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MapPin, Flame, Users, Bell, BarChart3,
  Bot, Zap, Clock, BellRing, AlertTriangle, Play,
  ChevronLeft, Shield, Activity, Ticket, Ambulance, Trophy, Layers, Car
} from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import SimulationDemo from '../demo/SimulationDemo';
import FinalSummaryScreen from '../summary/FinalSummaryScreen';

const navGroups = [
  {
    id: 'main',
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
      { to: '/venue',     icon: MapPin,           label: 'Venue Map'    },
      { to: '/heatmap',   icon: Flame,            label: 'Heat Map'     },
      { to: '/builder',   icon: Layers,           label: 'Twin Builder' },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { to: '/crowd',         icon: Users,         label: 'Crowd Intel'   },
      { to: '/parking',       icon: Car,           label: 'Parking'       },
      { to: '/tickets',       icon: Ticket,        label: 'Tickets'       },
      { to: '/emergency',     icon: Ambulance,     label: 'Emergency'     },
      { to: '/alerts',        icon: Bell,          label: 'Alerts',       badge: 'alerts' },
      { to: '/incidents',     icon: AlertTriangle, label: 'Incidents'     },
      { to: '/notifications', icon: BellRing,      label: 'Notifications' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Agents',
    items: [
      { to: '/agents',    icon: Bot,   label: 'Agent Network' },
      { to: '/simulator', icon: Zap,   label: 'Simulator'     },
      { to: '/timeline',  icon: Clock, label: 'AI Timeline'   },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics'   },
      { to: '/replay',    icon: Play,      label: 'Event Replay' },
    ],
  },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useEventStore();
  const unread = alerts.filter(a => !a.read && !a.dismissed).length;
  const location = useLocation();
  const [showDemo,    setShowDemo]    = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: sidebarOpen ? 232 : 68 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex-shrink-0 flex flex-col h-full overflow-hidden z-20"
        style={{
          background: 'rgba(6,12,22,0.9)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3.5 h-[60px] flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
              boxShadow: '0 0 20px rgba(0,212,255,0.4)',
            }}>
            <Shield size={16} className="text-white" />
          </motion.div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <p className="text-sm font-bold text-white tracking-tight leading-none font-display">EventiSphere</p>
                <p className="text-[10px] font-mono tracking-widest mt-0.5" style={{ color: '#00d4ff' }}>AI PLATFORM</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Demo button */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-2 pt-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowDemo(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.1))',
                  border: '1px solid rgba(0,212,255,0.25)',
                  color: '#00d4ff',
                  boxShadow: '0 0 16px rgba(0,212,255,0.1)',
                }}>
                <Play size={12} />
                Demo Story Mode
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
          {navGroups.map(group => (
            <div key={group.id} className="mb-1">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-[9px] font-bold tracking-widest uppercase px-3 pt-3 pb-1.5 text-white/25">
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              {group.items.map(item => {
                const Icon = item.icon;
                const isActive   = location.pathname === item.to;
                const badgeCount = item.badge === 'alerts' ? unread : 0;

                return (
                  <NavLink key={item.to} to={item.to} className="block">
                    <motion.div
                      whileHover={{ x: sidebarOpen ? 3 : 0 }}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors duration-150 group ${
                        isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
                      }`}
                      style={isActive ? {
                        background: 'rgba(0,212,255,0.1)',
                        border: '1px solid rgba(0,212,255,0.2)',
                      } : { border: '1px solid transparent' }}
                    >
                      {isActive && (
                        <motion.div layoutId="activeBar"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                          style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />
                      )}

                      <div className={`flex-shrink-0 transition-all duration-200 ${
                        isActive ? 'text-cyan-400' : 'text-white/35 group-hover:text-white/70'
                      }`} style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.7))' } : {}}>
                        <Icon size={16} />
                      </div>

                      <AnimatePresence>
                        {sidebarOpen && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="truncate flex-1 text-[13px]">
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {badgeCount > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className={`flex-shrink-0 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${sidebarOpen ? '' : 'absolute -top-0.5 -right-0.5'}`}
                          style={{ background: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.6)' }}>
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </motion.span>
                      )}
                    </motion.div>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Summary + status panel */}
        <div className="mx-2 mb-2 space-y-2">
          {/* Final summary button */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowSummary(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-semibold"
                style={{
                  background: 'rgba(168,85,247,0.08)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  color: '#a855f7',
                }}>
                <Trophy size={12} />
                View Event Summary
              </motion.button>
            )}
          </AnimatePresence>

          {/* System status */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-3 rounded-xl"
                style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={11} className="text-cyan-400" />
                  <span className="text-[10px] font-semibold text-cyan-400 tracking-wider">SYSTEM STATUS</span>
                </div>
                {[
                  { label: 'AI Engine',  status: 'Operational' },
                  { label: 'Data Feed',  status: 'Live'        },
                  { label: 'Agents',     status: '7/7 Active'  },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/40">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="live-dot w-1.5 h-1.5" />
                      <span className="text-[10px] text-emerald-400 font-mono">{s.status}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-10 flex-shrink-0 text-white/30 hover:text-white/70 transition-colors duration-200"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronLeft size={15} />
          </motion.div>
        </button>
      </motion.aside>

      {/* Demo modal */}
      <AnimatePresence>
        {showDemo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDemo(false)}
          >
            <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <SimulationDemo onDismiss={() => setShowDemo(false)} onComplete={() => setTimeout(() => setShowDemo(false), 1000)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final summary modal */}
      <AnimatePresence>
        {showSummary && <FinalSummaryScreen onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
    </>
  );
}
