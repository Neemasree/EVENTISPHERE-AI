import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Minimize2 } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import { formatTime } from '../../utils/helpers';

const quickQuestions = [
  'Why is Gate A crowded?',
  'What is the biggest risk right now?',
  'Which zone needs immediate action?',
  'Predict crowd in 10 minutes',
];

function getAIResponse(question: string, store: ReturnType<typeof useEventStore.getState>): string {
  const q = question.toLowerCase();
  const { zones, kpi, alerts, predictions } = store;
  const critical = zones.filter(z => z.riskLevel === 'critical');
  const highRisk = zones.filter(z => z.riskLevel === 'high');

  if (q.includes('gate a') || q.includes('gate a crowd')) {
    const gateA = zones.find(z => z.id === 'gate_a');
    return `Gate A currently has ${gateA?.currentCrowd} visitors (${gateA?.occupancy}% capacity). A bus arrived 8 minutes ago adding ~180 passengers. I recommend opening Gate B and C to redistribute the load. Expected wait time reduction: 62%.`;
  }
  if (q.includes('biggest risk') || q.includes('risk right now')) {
    if (critical.length > 0) return `The biggest risk is the ${critical[0].name} — currently at ${critical[0].occupancy}% capacity with a ${critical[0].waitingTime}-minute wait. Recommend immediate action to redistribute crowd.`;
    if (highRisk.length > 0) return `The highest risk zone is ${highRisk[0].name} at ${highRisk[0].occupancy}% capacity. Monitor closely — congestion predicted to peak in ~6 minutes.`;
    return `Overall risk is ${kpi.riskLevel}. All zones are within manageable limits. Continue monitoring.`;
  }
  if (q.includes('immediate action') || q.includes('needs action')) {
    const urgentAlert = alerts.find(a => a.severity === 'critical' && !a.dismissed);
    if (urgentAlert) return `Immediate action required: ${urgentAlert.title}. ${urgentAlert.message} I have already alerted the relevant agents.`;
    return `No critical immediate action needed. Recommend monitoring ${kpi.peakZone} — it is the peak density zone at this time.`;
  }
  if (q.includes('predict') || q.includes('10 min') || q.includes('minutes')) {
    const pred = predictions[0];
    if (pred) return `In 10 minutes, ${pred.zoneName} is predicted to reach ${pred.in10min} visitors (capacity: ${pred.capacity}). Risk: ${pred.predictedRisk.toUpperCase()} with ${pred.confidence}% confidence. Pre-emptive action advised now.`;
  }
  if (q.includes('crowd') || q.includes('people')) {
    return `Current crowd: ${kpi.currentCrowd.toLocaleString()} visitors, ${kpi.occupancyPercent}% of total capacity. Flow rate is ${kpi.flowRate} people/min. Peak zone is ${kpi.peakZone}.`;
  }
  if (q.includes('parking')) {
    const parkA = zones.find(z => z.id === 'parking_a');
    return `Parking A is at ${parkA?.occupancy}% capacity with ${parkA?.currentCrowd} vehicles. I recommend routing new arrivals to Parking B which is currently at 36%. Signage update can be deployed in ~2 minutes.`;
  }
  if (q.includes('recommendation') || q.includes('recommend')) {
    return `Top recommendation: Open Food Stall 3 in the Food Court. It is at ${zones.find(z=>z.id==='food_court')?.occupancy}% capacity — the highest risk zone. Expected density reduction: 28%. Confidence: 97%.`;
  }
  return `I'm monitoring ${zones.length} zones across the venue. Overall risk is ${kpi.riskLevel.toUpperCase()} with ${kpi.activeAlerts} active alerts. Ask me about any specific zone, prediction, or recommendation for more detail.`;
}

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const store = useEventStore();
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
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    setTyping(false);
    const response = getAIResponse(msg, store);
    addChatMessage({ id: `a_${Date.now()}`, role: 'assistant', content: response, timestamp: new Date() });
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #a855f7)', boxShadow: '0 0 30px rgba(0,212,255,0.5)' }}
          >
            <Bot size={22} className="text-white" />
            <motion.div className="absolute inset-0 rounded-full border-2 border-cyan-400"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-80 sm:w-96 bg-dark-800 border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(0,212,255,0.15)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8"
              style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(168,85,247,0.1))' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                  <Bot size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">EventSphere AI</p>
                  <p className="text-[9px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setMinimized(!minimized)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <Minimize2 size={12} />
                </button>
                <button onClick={() => setOpen(false)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {!minimized && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                  {/* Messages */}
                  <div className="h-64 overflow-y-auto p-3 space-y-3">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed
                          ${msg.role === 'user'
                            ? 'bg-cyan-500/20 border border-cyan-500/30 text-white'
                            : 'bg-white/5 border border-white/10 text-white/85'}`}>
                          {msg.content}
                          <p className="text-[9px] text-white/30 mt-1 text-right">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    {typing && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1">
                          {[0,1,2].map(i => (
                            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>

                  {/* Quick questions */}
                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                    {quickQuestions.map(q => (
                      <button key={q} onClick={() => send(q)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-cyan-500/40 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex items-center gap-2 px-3 pb-3">
                    <input
                      value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && send()}
                      placeholder="Ask anything about the event..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-cyan-500/50"
                    />
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
                      className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center"
                      style={{ boxShadow: '0 0 12px rgba(0,212,255,0.4)' }}>
                      <Send size={13} className="text-dark-900" />
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
