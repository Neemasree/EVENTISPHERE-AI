import { type ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIAssistant from '../ai/AIAssistant';
import { useEventStore } from '../../store/eventStore';
import { useVoiceAlerts } from '../../hooks/useVoiceAlerts';

interface Props { children: ReactNode }

export default function AppShell({ children }: Props) {
  const tickLiveData = useEventStore(s => s.tickLiveData);
  useVoiceAlerts();

  useEffect(() => {
    const id = setInterval(() => tickLiveData(), 4000);
    return () => clearInterval(id);
  }, [tickLiveData]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#020409' }}>

      {/* ── Ambient background layers ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Aurora blobs */}
        <div className="absolute -top-64 -left-64 w-[700px] h-[700px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00f5a0 0%, transparent 70%)', filter: 'blur(100px)', transform: 'translate(-50%, -50%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-fine opacity-100" />
        {/* Subtle noise */}
        <div className="absolute inset-0 opacity-30 noise" />
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex flex-col relative z-20">
        <Sidebar />
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Navbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-4 relative">
          <motion.div
            key="page-content"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full px-4 py-5 lg:px-6 lg:py-6 min-h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden flex items-center justify-around border-t safe-bottom flex-shrink-0"
          style={{
            background: 'rgba(6,12,22,0.97)',
            backdropFilter: 'blur(24px)',
            borderTopColor: 'rgba(255,255,255,0.07)',
            height: '56px',
          }}>
          {[
            { to: '/dashboard', icon: '⊞', label: 'Home' },
            { to: '/venue',     icon: '📍', label: 'Venue' },
            { to: '/heatmap',   icon: '🔥', label: 'Heat' },
            { to: '/alerts',    icon: '🔔', label: 'Alerts' },
            { to: '/analytics', icon: '📊', label: 'Stats' },
          ].map(item => (
            <a key={item.to} href={item.to}
              className="flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl text-white/35 hover:text-white/90 transition-all duration-200">
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* ── Floating AI Assistant ── */}
      <AIAssistant />
    </div>
  );
}
