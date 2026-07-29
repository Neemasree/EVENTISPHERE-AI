import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const AGENTS = [
  { id: 'parking',      name: 'Parking Intelligence Agent',  icon: '🚗', delay: 0.6  },
  { id: 'crowd',        name: 'Crowd Intelligence Agent',    icon: '👥', delay: 1.1  },
  { id: 'gate',         name: 'Gate Intelligence Agent',     icon: '🚪', delay: 1.6  },
  { id: 'ticket',       name: 'Ticket Intelligence Agent',   icon: '🎫', delay: 2.1  },
  { id: 'emergency',    name: 'Emergency Response Agent',    icon: '🚨', delay: 2.6  },
  { id: 'analytics',    name: 'Analytics Intelligence Agent',icon: '📊', delay: 3.1  },
  { id: 'orchestrator', name: 'Orchestrator AI',             icon: '🧠', delay: 3.6  },
];

interface Props { onComplete: () => void }

export default function LoadingScreen({ onComplete }: Props) {
  const [visibleAgents, setVisibleAgents] = useState<string[]>([]);
  const [showReady,     setShowReady]     = useState(false);
  const [fading,        setFading]        = useState(false);
  const [scanLine,      setScanLine]      = useState(0);

  useEffect(() => {
    // Animate scan line
    const scanId = setInterval(() => setScanLine(v => (v + 1) % 100), 30);

    // Reveal agents one by one
    AGENTS.forEach(agent => {
      setTimeout(() => {
        setVisibleAgents(prev => [...prev, agent.id]);
        // Play soft click sound
        try {
          const ctx = new AudioContext();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 440 + Math.random() * 200;
          o.type = 'sine';
          g.gain.setValueAtTime(0.08, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          o.start(); o.stop(ctx.currentTime + 0.15);
        } catch {}
      }, agent.delay * 1000);
    });

    // Show "System Ready"
    setTimeout(() => setShowReady(true), 4400);

    // Play success tone
    setTimeout(() => {
      try {
        const ctx = new AudioContext();
        [523, 659, 784].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = freq;
          o.type = 'sine';
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
          g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.4);
        });
      } catch {}
    }, 4400);

    // Fade out and complete
    setTimeout(() => setFading(true), 5200);
    setTimeout(() => onComplete(), 5700);

    return () => clearInterval(scanId);
  }, []); // eslint-disable-line

  return (
    <AnimatePresence>
      {!fading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: '#020409' }}
        >
          {/* Ambient aurora */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
                top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                filter: 'blur(60px)',
              }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
                top: '30%', left: '60%',
                filter: 'blur(80px)',
              }}
              animate={{ scale: [1.1, 1, 1.1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Scan line */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute w-full h-px opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                top: `${scanLine}%`,
              }}
            />
          </div>

          {/* Grid overlay */}
          <div className="absolute inset-0 bg-grid-fine opacity-100 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-8">

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 flex flex-col items-center"
            >
              {/* Shield icon with glow rings */}
              <div className="relative mb-6">
                <motion.div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
                    boxShadow: '0 0 60px rgba(0,212,255,0.5), 0 0 120px rgba(168,85,247,0.2)',
                  }}
                  animate={{ boxShadow: [
                    '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(168,85,247,0.15)',
                    '0 0 80px rgba(0,212,255,0.7), 0 0 160px rgba(168,85,247,0.3)',
                    '0 0 40px rgba(0,212,255,0.4), 0 0 80px rgba(168,85,247,0.15)',
                  ]}}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Shield size={36} className="text-white" />
                </motion.div>
                {/* Ping rings */}
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-3xl"
                    style={{ border: '1px solid rgba(0,212,255,0.4)' }}
                    animate={{ scale: [1, 1.8 + i * 0.4], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
                  />
                ))}
              </div>

              {/* Brand name */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-4xl font-bold tracking-tighter font-display text-white mb-2"
              >
                EventiSphere{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>AI</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-[11px] font-mono tracking-[0.3em] text-white/35 uppercase"
              >
                Intelligent Event Operations Platform
              </motion.p>
            </motion.div>

            {/* Initializing label */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-[11px] font-mono text-white/40 uppercase tracking-[0.2em] mb-6"
            >
              Initializing AI Agents...
            </motion.p>

            {/* Agent list */}
            <div className="w-full space-y-2 mb-8">
              {AGENTS.map((agent, i) => {
                const isVisible = visibleAgents.includes(agent.id);
                const isOrch    = agent.id === 'orchestrator';
                return (
                  <AnimatePresence key={agent.id}>
                    {isVisible && (
                      <motion.div
                        initial={{ opacity: 0, x: -30, height: 0 }}
                        animate={{ opacity: 1, x: 0, height: 'auto' }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                        style={{
                          background: isOrch
                            ? 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(168,85,247,0.08))'
                            : 'rgba(255,255,255,0.04)',
                          border: isOrch
                            ? '1px solid rgba(0,212,255,0.3)'
                            : '1px solid rgba(255,255,255,0.07)',
                          boxShadow: isOrch ? '0 0 20px rgba(0,212,255,0.1)' : 'none',
                        }}
                      >
                        {/* Check icon */}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isOrch
                              ? 'linear-gradient(135deg, #00d4ff, #a855f7)'
                              : 'rgba(0,245,160,0.2)',
                            border: isOrch ? 'none' : '1px solid rgba(0,245,160,0.4)',
                          }}
                        >
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </motion.div>

                        <span className="text-sm leading-none select-none">{agent.icon}</span>

                        <span className={`text-[13px] font-semibold flex-1 ${isOrch ? 'text-white' : 'text-white/75'}`}>
                          {agent.name}
                        </span>

                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className={`text-[10px] font-bold font-mono uppercase tracking-wider ${isOrch ? 'text-cyan-400' : 'text-emerald-400'}`}
                        >
                          Online
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                );
              })}
            </div>

            {/* System Ready */}
            <AnimatePresence>
              {showReady && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3 px-8 py-3 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.1))',
                      border: '1px solid rgba(0,212,255,0.4)',
                      boxShadow: '0 0 40px rgba(0,212,255,0.25)',
                    }}>
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }}
                    />
                    <span className="text-lg font-bold text-white tracking-wide font-display">
                      System Ready
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-white/25 tracking-widest">
                    7 / 7 AGENTS OPERATIONAL
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <div className="absolute bottom-12 left-8 right-8">
              <div className="h-px w-full rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }}
                  initial={{ width: '0%' }}
                  animate={{ width: showReady ? '100%' : `${(visibleAgents.length / AGENTS.length) * 88}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[9px] font-mono text-white/20">BOOT SEQUENCE</span>
                <span className="text-[9px] font-mono text-white/30">
                  {Math.round((visibleAgents.length / AGENTS.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
