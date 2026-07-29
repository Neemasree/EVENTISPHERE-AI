import { type ReactNode, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIAssistant from '../ai/AIAssistant';
import { useEventStore } from '../../store/eventStore';
import { useVoiceAlerts } from '../../hooks/useVoiceAlerts';

interface Props { children: ReactNode }

export default function AppShell({ children }: Props) {
  const tickLiveData = useEventStore(s => s.tickLiveData);
  useVoiceAlerts();

  // Live data tick every 4s
  useEffect(() => {
    const id = setInterval(() => tickLiveData(), 4000);
    return () => clearInterval(id);
  }, [tickLiveData]);

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-dark-900 relative">
          {/* Grid background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
          <div className="relative z-10 p-4 lg:p-6">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around bg-dark-800 border-t border-white/8 h-14 px-2 mobile-bottom-nav">
          {[
            { to: '/dashboard', icon: '⊞', label: 'Home' },
            { to: '/venue',     icon: '📍', label: 'Venue' },
            { to: '/heatmap',   icon: '🔥', label: 'Heat' },
            { to: '/alerts',    icon: '🔔', label: 'Alerts' },
            { to: '/analytics', icon: '📊', label: 'Stats' },
          ].map(item => (
            <a key={item.to} href={item.to}
              className="flex flex-col items-center gap-0.5 text-white/40 hover:text-white/90 transition-colors py-1 px-3 rounded-lg">
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
