import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Minimize2, Sparkles, ChevronDown } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatTime } from '../../utils/helpers';

const quickQuestions = [
  'Biggest risk right now?',
  'Gate A status?',
  'Crowd prediction 10min',
  'Top recommendation?',
];

function getAIResponse(question: string, store: ReturnType<typeof useEventStore.getState>): string {
  const q = question.toLowerCase();
  const { zones, kpi, alerts, predictions } = store;
  const critical = zones.filter(z => z.riskLevel === 'critical');
  const highRisk  = zones.filter(z => z.riskLevel === 'high');

  if (q.includes('gate a')) {
    const gateA = zones.find(z => z.id === 'gate_a');
    return `Gate A currently has ${gateA?.currentCrowd} visitors (${gateA?.occupancy}% capacity). A bus arrived 8 minutes ago adding ~180 passengers. Recommend opening Gate B and C — expected wait time reduction: 62%.`;
  }
  if (q.includes('biggest risk') || q.includes('risk right now')) {
    if (critical.length > 0) return `Biggest risk: **${critical[0].name}** at ${critical[0].occupancy}% capacity. ${critical[0].waitingTime}-min wait time. Immediate action recommended.`;
    if (highRisk.length > 0) return `Highest risk: **${highRisk[0].name}** at ${highRisk[0].occupancy}% capacity. Congestion predicted to peak in ~6 minutes.`;
    return `Overall risk is ${kpi.riskLevel}. All zones within manageable limits. Continue monitoring.`;
  }
  if (q.includes('recommend')) {
    const fc = zones.find(z => z.id === 'food_court');
    return `Top recommendation: Open Food Stall 3 in the Food Court. Currently at ${fc?.occupancy}% capacity. Expected density reduction: 28%. Confidence: 97%.`;
  }
  if (q.includes('predict') || q.includes('10min') || q.includes('10 min')) {
    const pred = predictions[0];
    if (pred) return `In 10 minutes: ${pred.zoneName} predicted at ${pred.in10min} visitors (cap ${pred.capacity}). Risk: ${pred.predictedRisk.toUpperCase()}. Confidence: ${pred.confidence}%.`;
  }
  if (q.includes('crowd') || q.includes('people')) {
    return `Current crowd: ${kpi.currentCrowd.toLocaleString()} visitors at ${kpi.occupancyPercent}% occupancy. Flow rate: ${kpi.flowRate}/min. Peak zone: ${kpi.peakZone}.`;
  }
  if (q.includes('parking')) {
    const parkA = zones.find(z => z.id === 'parking_a');
    return `Parking A: ${parkA?.occupancy}% full with ${parkA?.currentCrowd} vehicles. Recommend routing to Parking B (currently 36%). Signage update: ~2 min deployment.`;
  }
  return `Monitoring ${zones.length} zones. Overall risk: ${kpi.riskLevel.toUpperCase()}. ${kpi.activeAlerts} active alerts. Ask about any specific zone, risk, or recommendation.`;
}

export default function AIAssistant() {
  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input,     setInput]     = useState('');
  const [typing,    setTyping]    = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const store  = useEventStore();
  const { chatMessages, addChatMessage } = store;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, typing]);

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    setInput('');
    addChatMessage({ id: `u_${Date.now()}`, role: 'user', content: msg, timestamp: new Date() });
    setTyping(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 700));
    setTyping(false);
    addChatMessage({ id: `a_${Date.now()}`, role: 'assistant', content: getAIResponse(msg, store), timestamp: new Date() });
  };

  return (
    <>
      {/* ── FAB ── */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #a855f7 100%)',
              boxShadow: '0 0 30px rgba(0,212,255,0.45), 0 8px 20px rgba(0,0,0,0.4)',
            }}
          >
            <Bot size={22} className="text-white" />
            {/* Ripple rings */}
            <motion.div className="absolute inset-0 rounded-2xl"
              style={{ border: '2px solid rgba(0,212,255,0.5)' }}
              animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="absolute inset-0 rounded-2xl"
              style={{ border: '2px solid rgba(168,85,247,0.4)' }}
              animate={{ scale: [1, 1.7], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-80 sm:w-[380px] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,16,32,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderTopColor: 'rgba(0,212,255,0.2)',
              boxShadow: '0 0 0 1px rgba(0,212,255,0.08), 0 30px 80px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(40px)',
            }}
          >
            {/* Top accent */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, #a855f7, transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,212,255,0.04)' }}>
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(168,85,247,0.2))',
                    border: '1px solid rgba(0,212,255,0.25)',
                  }}>
                  <Bot size={15} style={{ color: '#00d4ff' }} />
                  <motion.div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                    style={{ background: '#00f5a0', border: '2px solid rgba(8,16,32,0.97)' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white leading-none">EventiSphere AI</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-emerald-400 font-mono">Online · Monitoring</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(v => !v)} className="btn-icon w-7 h-7 rounded-lg">
                  {minimized ? <ChevronDown size={12} /> : <Minimize2 size={12} />}
                </button>
                <button onClick={() => setOpen(false)} className="btn-icon w-7 h-7 rounded-lg">
                  <X size={13} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!minimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Messages */}
                  <div className="h-64 overflow-y-auto p-3 space-y-2.5">
                    {chatMessages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-1.5 flex-shrink-0 mt-auto mb-0.5"
                            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
                            <Sparkles size={11} style={{ color: '#00d4ff' }} />
                          </div>
                        )}
                        <div className={`max-w-[82%] px-3 py-2.5 rounded-xl text-[12px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm text-white/80'
                        }`}
                          style={msg.role === 'user' ? {
                            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1))',
                            border: '1px solid rgba(0,212,255,0.25)',
                          } : {
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)',
                          }}>
                          {msg.content}
                          <p className="text-[9px] text-white/25 mt-1.5 text-right font-mono">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {typing && (
                      <div className="flex justify-start items-end gap-1.5">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
                          <Sparkles size={11} style={{ color: '#00d4ff' }} />
                        </div>
                        <div className="px-3 py-2.5 rounded-xl rounded-bl-sm"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
                          <div className="flex items-center gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.div key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ background: '#00d4ff' }}
                                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Quick questions */}
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="w-full text-[9px] text-white/25 uppercase tracking-wider pt-2 pb-0.5 font-bold">Quick Ask</p>
                    {quickQuestions.map(q => (
                      <button key={q} onClick={() => send(q)}
                        className="text-[10px] px-2.5 py-1 rounded-lg transition-all font-medium"
                        style={{
                          background: 'rgba(0,212,255,0.06)',
                          border: '1px solid rgba(0,212,255,0.15)',
                          color: 'rgba(0,212,255,0.8)',
                        }}
                        onMouseEnter={e => {
                          (e.target as HTMLElement).style.background = 'rgba(0,212,255,0.12)';
                          (e.target as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)';
                        }}
                        onMouseLeave={e => {
                          (e.target as HTMLElement).style.background = 'rgba(0,212,255,0.06)';
                          (e.target as HTMLElement).style.borderColor = 'rgba(0,212,255,0.15)';
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 p-3 pt-0">
                    <input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && send()}
                      placeholder="Ask anything about the event..."
                      className="input-field text-[12px] py-2.5"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => send()}
                      disabled={!input.trim()}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: input.trim()
                          ? 'linear-gradient(135deg, #00d4ff, #0088cc)'
                          : 'rgba(255,255,255,0.06)',
                        boxShadow: input.trim() ? '0 0 14px rgba(0,212,255,0.35)' : 'none',
                      }}
                    >
                      <Send size={14} style={{ color: input.trim() ? '#020409' : 'rgba(255,255,255,0.3)' }} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
