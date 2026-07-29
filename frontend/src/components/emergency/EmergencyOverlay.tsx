import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, MapPin, Clock, Users, Phone, CheckCircle, Radio } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';

interface Incident {
  id: string;
  type: 'medical' | 'fire' | 'security' | 'crowd_surge';
  title: string;
  zone: string;
  severity: 'medium' | 'high' | 'critical';
  description: string;
  teamEta: number;   // minutes
  teamDist: number;  // meters
  status: 'active' | 'responding' | 'resolved';
  timestamp: Date;
}

const INCIDENT_TYPES = {
  medical:     { icon: '🚑', color: '#f43f5e', label: 'Medical Emergency' },
  fire:        { icon: '🔥', color: '#fb923c', label: 'Fire Alert' },
  security:    { icon: '🛡️',  color: '#fbbf24', label: 'Security Incident' },
  crowd_surge: { icon: '🌊', color: '#a855f7', label: 'Crowd Surge' },
};

interface Props {
  incident?: Incident | null;
  onDismiss?: () => void;
}

export default function EmergencyOverlay({ incident, onDismiss }: Props) {
  const { addAlert, addAgentMessage } = useEventStore();
  const [eta, setEta] = useState(incident?.teamEta ?? 2);
  const [status, setStatus] = useState<'active' | 'responding' | 'resolved'>(incident?.status ?? 'active');
  const [agentLog, setAgentLog] = useState<string[]>([]);

  useEffect(() => {
    if (!incident) return;

    // Simulate agent responses
    const msgs = [
      { msg: `Emergency Agent: ${incident.type.toUpperCase()} detected at ${incident.zone}. Dispatching Team Alpha.`, delay: 500 },
      { msg: `Orchestrator: All agents on alert. Clearing path to ${incident.zone}.`, delay: 1200 },
      { msg: `Crowd Agent: Reducing density around ${incident.zone}. Diverting crowd flow.`, delay: 2000 },
      { msg: `Parking Agent: Emergency lane reserved at main entrance.`, delay: 2800 },
      { msg: `Gate Agent: Exit B and C opened for emergency access.`, delay: 3500 },
      { msg: `Analytics Agent: Incident logged. Response time tracking active.`, delay: 4200 },
    ];

    msgs.forEach(({ msg, delay }) => {
      setTimeout(() => setAgentLog(prev => [...prev, msg]), delay);
    });

    // ETA countdown
    const etaId = setInterval(() => {
      setEta(v => {
        if (v <= 1) {
          clearInterval(etaId);
          setStatus('responding');
          return 0;
        }
        return v - 1;
      });
    }, 30000 / (incident.teamEta || 2));

    return () => clearInterval(etaId);
  }, [incident?.id]); // eslint-disable-line

  if (!incident) return null;

  const typeCfg = INCIDENT_TYPES[incident.type];
  const isResolved = status === 'resolved';
  const isCritical = incident.severity === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Critical pulse overlay */}
      {isCritical && !isResolved && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(244,63,94,0.04)' }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      <motion.div
        initial={{ scale: 0.88, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(6,12,24,0.98)',
          border: isResolved
            ? '1px solid rgba(0,245,160,0.4)'
            : `1px solid ${typeCfg.color}50`,
          boxShadow: isResolved
            ? '0 0 60px rgba(0,245,160,0.2), 0 40px 100px rgba(0,0,0,0.8)'
            : `0 0 60px ${typeCfg.color}25, 0 40px 100px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Top bar */}
        <div className="h-1"
          style={{
            background: isResolved
              ? 'linear-gradient(90deg, #00f5a0, #00d4ff)'
              : `linear-gradient(90deg, transparent, ${typeCfg.color}, transparent)`,
            animation: isCritical && !isResolved ? 'criticalPulse 1.5s ease-in-out infinite' : undefined,
          }} />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={isCritical && !isResolved ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${typeCfg.color}15`, border: `1px solid ${typeCfg.color}35` }}>
              {typeCfg.icon}
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isCritical && !isResolved && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${typeCfg.color}20`, color: typeCfg.color, border: `1px solid ${typeCfg.color}40` }}>
                    ● LIVE
                  </motion.span>
                )}
                {isResolved && (
                  <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(0,245,160,0.15)', color: '#00f5a0', border: '1px solid rgba(0,245,160,0.3)' }}>
                    ✓ RESOLVED
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-white leading-tight">{typeCfg.label}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{incident.description}</p>
            </div>
          </div>
          {onDismiss && (
            <button onClick={onDismiss}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 transition-colors flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-3 gap-3 px-5 pb-4">
          {[
            { icon: <MapPin size={13} />, label: 'Zone',     value: incident.zone,              color: typeCfg.color },
            { icon: <Clock size={13} />,  label: 'Team ETA', value: eta > 0 ? `${eta} min` : 'ON SCENE', color: eta > 0 ? '#fbbf24' : '#00f5a0' },
            { icon: <Users size={13} />,  label: 'Distance', value: `${incident.teamDist}m`,   color: '#a855f7' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ background: `${s.color}08`, border: `1px solid ${s.color}18` }}>
              <div className="flex items-center justify-center mb-1" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-[13px] font-bold font-mono leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Agent log */}
        <div className="mx-5 mb-4 rounded-xl overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Radio size={10} style={{ color: '#00d4ff' }} />
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Agent Response Log</span>
          </div>
          <div className="p-3 space-y-1.5 max-h-36 overflow-y-auto">
            <AnimatePresence>
              {agentLog.map((log, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2">
                  <span className="text-[9px] font-mono text-emerald-400 mt-0.5 flex-shrink-0">›</span>
                  <p className="text-[10px] text-white/55 leading-snug">{log}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {agentLog.length === 0 && (
              <div className="flex items-center gap-2">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: typeCfg.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
                <span className="text-[10px] text-white/30 font-mono">Dispatching agents...</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 px-5 pb-5">
          {!isResolved && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStatus('resolved')}
              className="flex-1 py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #00f5a0, #00c47a)',
                color: '#020409',
                boxShadow: '0 0 20px rgba(0,245,160,0.3)',
              }}>
              <CheckCircle size={15} />
              Mark Resolved
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex-1 py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)',
            }}>
            <Phone size={15} />
            Contact Team
          </motion.button>
          {onDismiss && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={onDismiss}
              className="px-4 py-3 rounded-xl text-[12px] font-semibold text-white/40 hover:text-white/70 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              Dismiss
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
