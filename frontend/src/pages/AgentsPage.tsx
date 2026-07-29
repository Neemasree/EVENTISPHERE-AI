import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import AgentFlowPanel from '../components/agents/AgentFlowPanel';
import AIDecisionEngine from '../components/agents/AIDecisionEngine';
import type { AgentStatus } from '../types';
import { Brain, Zap, MessageSquare, Activity } from 'lucide-react';

const STATUS_CFG: Record<AgentStatus, { color: string; bg: string; border: string; label: string }> = {
  active:     { color: '#00f5a0', bg: 'rgba(0,245,160,0.07)',  border: 'rgba(0,245,160,0.2)',  label: 'Active'     },
  processing: { color: '#00d4ff', bg: 'rgba(0,212,255,0.07)',  border: 'rgba(0,212,255,0.2)',  label: 'Processing' },
  alert:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.09)',  border: 'rgba(244,63,94,0.28)', label: 'Alert'      },
  idle:       { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', label: 'Idle' },
};

const ROLE_DESC: Record<string, string> = {
  orchestrator: 'Coordinates all agents and routes decisions',
  crowd:        'Monitors density, predicts overflow zones',
  parking:      'Manages lot capacity and vehicle rerouting',
  gate:         'Controls gate flow and crowd redistribution',
  ticket:       'Validates tickets, blocks duplicates in real-time',
  emergency:    'Dispatches response teams on critical events',
  analytics:    'Generates reports and trend analysis',
};

export default function AgentsPage() {
  const agents = useEventStore(s => s.agents);
  const agentMessages = useEventStore(s => s.agentMessages);
  const [activeTab, setActiveTab] = useState<'network' | 'decisions'>('network');

  const totalMsgs = agents.reduce((s, a) => s + a.messagesProcessed, 0);
  const alertCount = agents.filter(a => a.status === 'alert').length;
  const activeCount = agents.filter(a => a.status === 'active' || a.status === 'processing').length;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">AI Agent Network</h1>
          <p className="page-subtitle">7 specialized agents working in parallel — monitoring, deciding, and acting</p>
        </div>
        {/* System health pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,245,160,0.07)', border: '1px solid rgba(0,245,160,0.2)' }}>
            <Activity size={11} style={{ color: '#00f5a0' }} />
            <span className="text-[11px] font-bold text-emerald-400">{activeCount} Active</span>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[11px] font-bold text-red-400">{alertCount} Alert</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <MessageSquare size={11} style={{ color: '#00d4ff' }} />
            <span className="text-[11px] font-bold text-cyan-400">{totalMsgs.toLocaleString()} msgs</span>
          </div>
        </div>
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {agents.map((agent, i) => {
          const cfg = STATUS_CFG[agent.status];
          const isPulsing = agent.status === 'processing' || agent.status === 'alert';
          return (
            <motion.div key={agent.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>

              {/* Top accent */}
              <div className="absolute top-0 left-4 right-4 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />

              {/* Status + icon row */}
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl leading-none select-none">{agent.icon}</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full"
                      style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                    {isPulsing && (
                      <motion.div className="absolute inset-0 rounded-full"
                        style={{ border: `1px solid ${cfg.color}` }}
                        animate={{ scale: [0.8, 2.2], opacity: [0.7, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity }} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              {/* Name + role */}
              <p className="text-[13px] font-bold text-white mb-0.5 leading-tight">{agent.name}</p>
              <p className="text-[10px] text-white/35 leading-snug mb-3">
                {ROLE_DESC[agent.id] ?? agent.lastAction}
              </p>

              {/* Last action */}
              <div className="px-2.5 py-2 rounded-xl mb-3"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/25 mb-1">Last Action</p>
                <p className="text-[10px] text-white/55 leading-snug line-clamp-2">{agent.lastAction}</p>
              </div>

              {/* Messages processed */}
              <div className="flex items-center justify-between pt-2.5"
                style={{ borderTop: `1px solid ${cfg.border}` }}>
                <span className="text-[9px] text-white/25 uppercase tracking-wider">Processed</span>
                <span className="text-[12px] font-mono font-bold" style={{ color: cfg.color }}>
                  {agent.messagesProcessed.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {([
          { id: 'network',   label: 'Communications Feed', icon: <MessageSquare size={12} /> },
          { id: 'decisions', label: 'AI Decision Engine',  icon: <Brain size={12} /> },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all"
            style={activeTab === tab.id
              ? { background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.25)' }
              : { color: 'rgba(255,255,255,0.35)', border: '1px solid transparent' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}>
          {activeTab === 'network' ? <AgentFlowPanel /> : <AIDecisionEngine />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
