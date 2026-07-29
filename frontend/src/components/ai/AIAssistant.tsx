import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Minimize2, Sparkles, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEventStore } from '../../store/eventStore';
import { formatTime } from '../../utils/helpers';

const quickQuestions = [
  'Biggest risk right now?',
  'What should I do in the next 15 min?',
  'Compare Gate A and Gate B',
  'Top recommendation?',
];

const RISK_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function buildEventContext(store: ReturnType<typeof useEventStore.getState>) {
  const { zones, kpi, alerts, predictions, recommendations, incidents, events, activeEventId } = store;
  const activeEvent = events.find(e => e.id === activeEventId);

  const activeAlerts = alerts.filter(a => !a.dismissed);
  const criticalZones = zones.filter(z => z.riskLevel === 'critical');
  const highZones     = zones.filter(z => z.riskLevel === 'high');
  const pendingRecs   = recommendations.filter(r => !r.applied);
  const openIncidents = incidents.filter(i => !i.resolved);

  // Sort zones: critical first, then high, medium, low — LLM reads top-down
  const sortedZones = [...zones].sort(
    (a, b) => (RISK_ORDER[a.riskLevel] ?? 4) - (RISK_ORDER[b.riskLevel] ?? 4)
  );

  // Sort recommendations by confidence descending
  const sortedRecs = [...pendingRecs].sort((a, b) => b.confidence - a.confidence);

  // Sort alerts: critical → high → medium → low
  const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedAlerts = [...activeAlerts].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4)
  );

  return {
    // ── Operational summary — gives the LLM immediate situational awareness ──
    operationalSummary: {
      event:           activeEvent?.name ?? 'Unknown Event',
      overallRisk:     kpi.riskLevel,
      activeVisitors:  kpi.currentCrowd,
      totalCapacity:   kpi.totalCapacity,
      occupancyPercent: kpi.occupancyPercent,
      avgWaitTimeMin:  kpi.avgWaitTime,
      peakZone:        kpi.peakZone,
      flowRatePerMin:  kpi.flowRate,
      activeAlerts:    activeAlerts.length,
      criticalZones:   criticalZones.length,
      highRiskZones:   highZones.length,
      openIncidents:   openIncidents.length,
      pendingActions:  pendingRecs.length,
      topRecommendation: sortedRecs[0]?.title ?? null,
    },

    // ── Zones sorted by severity (critical first) ──
    zones: sortedZones.map(z => {
      const pred = predictions.find(p => p.zoneId === z.id);
      return {
        name:              z.name,
        type:              z.type,
        currentOccupancy:  z.currentCrowd,
        capacity:          z.maxCapacity,
        occupancyPercent:  z.occupancy,
        waitingTimeMin:    z.waitingTime,
        riskLevel:         z.riskLevel,
        // inline prediction so the LLM sees zone + forecast together
        forecast: pred ? {
          in5min:     pred.in5min,
          in10min:    pred.in10min,
          in30min:    pred.in30min,
          risk:       pred.predictedRisk,
          confidence: pred.confidence,
        } : null,
      };
    }),

    // ── Alerts sorted by severity ──
    alerts: sortedAlerts.slice(0, 6).map(a => ({
      severity: a.severity,
      title:    a.title,
      message:  a.message,
      zone:     a.zone ?? null,
    })),

    // ── Recommendations sorted by confidence ──
    recommendations: sortedRecs.slice(0, 4).map(r => ({
      priority:          sortedRecs.indexOf(r) + 1,
      title:             r.title,
      description:       r.description,
      action:            r.action,
      zone:              r.zone,
      expectedReduction: r.expectedReduction,
      estimatedTimeMin:  r.estimatedTime,
      confidence:        r.confidence,
    })),

    // ── Open incidents only ──
    incidents: openIncidents.slice(0, 3).map(i => ({
      severity:    i.severity,
      zone:        i.zone,
      description: i.description,
    })),

    // ── KPIs for comparison questions ──
    kpis: {
      totalCrowd:       kpi.currentCrowd,
      totalCapacity:    kpi.totalCapacity,
      occupancyPercent: kpi.occupancyPercent,
      avgWaitTimeMin:   kpi.avgWaitTime,
      flowRatePerMin:   kpi.flowRate,
      riskLevel:        kpi.riskLevel,
      activeAlerts:     kpi.activeAlerts,
    },
  };
}

async function fetchAIResponse(question: string, store: ReturnType<typeof useEventStore.getState>): Promise<string> {
  const eventContext = buildEventContext(store);
  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, eventContext }),
    });
    if (!res.ok) throw new Error('Backend unavailable');
    const data = await res.json();
    return data.answer ?? 'No response received from operations center.';
  } catch {
    // Offline structured fallback — reads from enriched context shape
    const ctx = buildEventContext(store);
    const s   = ctx.operationalSummary;
    const topZone = ctx.zones[0];  // already sorted critical-first
    const topRec  = ctx.recommendations[0];
    const q = question.toLowerCase();

    if (q.includes('risk') || q.includes('biggest') || q.includes('status') || q.includes('summar')) {
      return [
        `## 🚨 Situation Summary`,
        `**Overall Risk:** ${s.overallRisk.toUpperCase()} — ${s.criticalZones} critical zone(s), ${s.highRiskZones} high-risk zone(s)`,
        `**Active Visitors:** ${s.activeVisitors.toLocaleString()} / ${s.totalCapacity.toLocaleString()} (${s.occupancyPercent}%)`,
        `**Primary Issue:** ${topZone?.name ?? 'N/A'} at ${topZone?.occupancyPercent ?? 'N/A'}% (${topZone?.currentOccupancy ?? 'N/A'} / ${topZone?.capacity ?? 'N/A'}) — Risk: ${topZone?.riskLevel?.toUpperCase() ?? 'N/A'}`,
        `**Active Alerts:** ${s.activeAlerts} | **Open Incidents:** ${s.openIncidents} | **Avg Wait:** ${s.avgWaitTimeMin} min`,
        `**Recommended Actions:**\n1. ${topRec?.action ?? 'Deploy crowd marshals to peak zones.'}\n2. Monitor all high-risk zones every 2 minutes.`,
        `**Expected Improvement:** ${topRec?.expectedReduction ?? 'N/A'}% crowd density reduction.`,
        `**Confidence:** ${topRec?.confidence ?? 'N/A'}%`,
      ].join('\n\n');
    }
    if (q.includes('recommend') || q.includes('first') || q.includes('implement')) {
      return [
        `## 🎯 Priority #1 Recommendation`,
        `**Action:** ${topRec?.title ?? 'N/A'}`,
        `**Reason:** ${topRec?.description ?? 'N/A'}`,
        `**What to do:** ${topRec?.action ?? 'N/A'}`,
        `**Expected Improvement:** ${topRec?.expectedReduction ?? 'N/A'}% reduction — deployable in ${topRec?.estimatedTimeMin ?? 'N/A'} min.`,
        `**Confidence:** ${topRec?.confidence ?? 'N/A'}%`,
        ctx.recommendations[1] ? `**Next:** ${ctx.recommendations[1].title} (${ctx.recommendations[1].confidence}% confidence)` : '',
      ].filter(Boolean).join('\n\n');
    }
    if (q.includes('compare')) {
      const zA = ctx.zones.find(z => z.name.toLowerCase().includes('gate a'));
      const zB = ctx.zones.find(z => z.name.toLowerCase().includes('gate b'));
      if (zA && zB) return [
        `## ⚖️ Gate Comparison`,
        `**Gate A:** ${zA.currentOccupancy} / ${zA.capacity} (${zA.occupancyPercent}%) — Risk: ${zA.riskLevel.toUpperCase()} — Wait: ${zA.waitingTimeMin} min`,
        `**Gate B:** ${zB.currentOccupancy} / ${zB.capacity} (${zB.occupancyPercent}%) — Risk: ${zB.riskLevel.toUpperCase()} — Wait: ${zB.waitingTimeMin} min`,
        `**Assessment:** Gate A has ${zA.occupancyPercent - zB.occupancyPercent}% higher load. Redirecting arrivals to Gate B would reduce Gate A congestion.`,
      ].join('\n\n');
    }
    return [
      `## 📊 Operational Status`,
      `**Event:** ${s.event} | **Risk:** ${s.overallRisk.toUpperCase()}`,
      `**Crowd:** ${s.activeVisitors.toLocaleString()} / ${s.totalCapacity.toLocaleString()} (${s.occupancyPercent}%)`,
      `**Peak Zone:** ${s.peakZone} | **Avg Wait:** ${s.avgWaitTimeMin} min | **Flow:** ${s.flowRatePerMin}/min`,
      `**Alerts:** ${s.activeAlerts} active | **Incidents:** ${s.openIncidents} open`,
      `**Top Action:** ${topRec?.action ?? 'All zones stable — continue monitoring.'}`,
    ].join('\n\n');
  }
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
    const answer = await fetchAIResponse(msg, store);
    setTyping(false);
    addChatMessage({ id: `a_${Date.now()}`, role: 'assistant', content: answer, timestamp: new Date() });
  };

  return (
    <>
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-80 sm:w-[420px] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,16,32,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderTopColor: 'rgba(0,212,255,0.2)',
              boxShadow: '0 0 0 1px rgba(0,212,255,0.08), 0 30px 80px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(40px)',
            }}
          >
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
                    <span className="text-[9px] text-emerald-400 font-mono">Operations Command · Live</span>
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
                  <div className="h-80 overflow-y-auto p-3 space-y-2.5">
                    {chatMessages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center mr-1.5 flex-shrink-0 mt-1"
                            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)' }}>
                            <Sparkles size={11} style={{ color: '#00d4ff' }} />
                          </div>
                        )}
                        <div className={`max-w-[88%] px-3 py-2.5 rounded-xl text-[11.5px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'rounded-br-sm text-white'
                            : 'rounded-bl-sm text-white/85'
                        }`}
                          style={msg.role === 'user' ? {
                            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.1))',
                            border: '1px solid rgba(0,212,255,0.25)',
                          } : {
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)',
                          }}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert prose-sm max-w-none
                              [&_h2]:text-[12px] [&_h2]:font-bold [&_h2]:text-cyan-300 [&_h2]:mb-1 [&_h2]:mt-0
                              [&_strong]:text-white/90 [&_strong]:font-semibold
                              [&_p]:mb-1.5 [&_p]:text-white/80
                              [&_ol]:pl-4 [&_ol]:mb-1 [&_li]:mb-0.5
                              [&_ul]:pl-4 [&_ul]:mb-1">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                          <p className="text-[9px] text-white/25 mt-1.5 text-right font-mono">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}

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
                      placeholder="Ask the operations center..."
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
