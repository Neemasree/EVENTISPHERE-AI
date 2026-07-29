import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, ChevronRight, X, Zap } from 'lucide-react';
import { useEventStore } from '../../store/eventStore';
import type { ScenarioType } from '../../types';
import { Sounds } from '../../utils/sounds';

interface DemoStep {
  id: string;
  title: string;
  narrative: string;
  agent: string;
  agentIcon: string;
  scenario?: ScenarioType;
  duration: number; // ms
  highlight: string; // color
}

const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 's1',
    title: 'Event Doors Open',
    narrative: 'The venue opens. Visitors begin arriving. Parking Agent starts monitoring lot capacity in real time.',
    agent: 'Parking Agent', agentIcon: '🚗',
    scenario: 'add_50',
    duration: 4000,
    highlight: '#00d4ff',
  },
  {
    id: 's2',
    title: 'Crowd Forms at Gate A',
    narrative: 'Visitors leave parking and move toward Gate A. Crowd Agent detects queue building — 76% occupancy.',
    agent: 'Crowd Agent', agentIcon: '👥',
    scenario: 'add_100',
    duration: 4000,
    highlight: '#fbbf24',
  },
  {
    id: 's3',
    title: 'Bus Arrives — Gate A Surge',
    narrative: 'A coach bus drops 180 passengers at Gate A. Crowd Agent alerts Orchestrator. Gate Agent opens Gate C.',
    agent: 'Gate Agent', agentIcon: '🚪',
    scenario: 'bus_arrives',
    duration: 5000,
    highlight: '#fb923c',
  },
  {
    id: 's4',
    title: 'Ticket Verification Active',
    narrative: 'Ticket Agent verifies 14,832 entries. 2 duplicate tickets detected and blocked. Security notified.',
    agent: 'Ticket Agent', agentIcon: '🎫',
    duration: 3500,
    highlight: '#60a5fa',
  },
  {
    id: 's5',
    title: 'Concert Starts — Main Stage Surge',
    narrative: 'Main act begins. 800+ visitors surge toward Main Stage. Orchestrator coordinates all agents.',
    agent: 'Orchestrator AI', agentIcon: '🧠',
    scenario: 'concert_starts',
    duration: 5000,
    highlight: '#a855f7',
  },
  {
    id: 's6',
    title: 'Medical Emergency Detected',
    narrative: 'Emergency Agent detects a medical incident near Main Stage. Team dispatched. ETA: 2 minutes.',
    agent: 'Emergency Agent', agentIcon: '🚨',
    scenario: 'emergency',
    duration: 5000,
    highlight: '#f43f5e',
  },
  {
    id: 's7',
    title: 'Emergency Resolved',
    narrative: 'Medical team arrives in 2 minutes. Crowd cleared. Analytics Agent logs the incident for review.',
    agent: 'Analytics Agent', agentIcon: '📊',
    duration: 3500,
    highlight: '#00f5a0',
  },
  {
    id: 's8',
    title: 'Concert Ends — Mass Exit',
    narrative: '20,000 people head for exits simultaneously. AI predicts congestion in 7 min. Opens Exit B and C.',
    agent: 'Orchestrator AI', agentIcon: '🧠',
    scenario: 'event_ends',
    duration: 5000,
    highlight: '#00d4ff',
  },
];

interface Props { onComplete?: () => void; onDismiss?: () => void }

export default function SimulationDemo({ onComplete, onDismiss }: Props) {
  const { triggerScenario } = useEventStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [completed,   setCompleted]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = DEMO_SCRIPT[currentStep];
  const progress = ((currentStep + (playing ? 0.5 : 0)) / DEMO_SCRIPT.length) * 100;

  const runStep = (index: number) => {
    if (index >= DEMO_SCRIPT.length) {
      setCompleted(true);
      setPlaying(false);
      onComplete?.();
      return;
    }
    const s = DEMO_SCRIPT[index];
    if (s.scenario) {
      triggerScenario(s.scenario);
      Sounds.trigger?.();
    }
  };

  useEffect(() => {
    if (!playing) return;
    runStep(currentStep);
    timerRef.current = setTimeout(() => {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next >= DEMO_SCRIPT.length) {
        setCompleted(true);
        setPlaying(false);
        onComplete?.();
      }
    }, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, currentStep]); // eslint-disable-line

  const handlePlay = () => {
    if (completed) { setCurrentStep(0); setCompleted(false); }
    setPlaying(v => !v);
  };

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = currentStep + 1;
    runStep(next);
    setCurrentStep(Math.min(next, DEMO_SCRIPT.length - 1));
    if (next >= DEMO_SCRIPT.length) { setCompleted(true); setPlaying(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(6,12,24,0.97)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>

      {/* Top accent */}
      <div className="h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${step.highlight}, transparent)` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)' }}>
            <Zap size={15} style={{ color: '#fb923c' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white">Demo Story Mode</p>
            <p className="text-[10px] text-white/30 font-mono">Step {currentStep + 1} / {DEMO_SCRIPT.length}</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="btn-icon w-7 h-7 rounded-lg"><X size={13} /></button>
        )}
      </div>

      {/* Step card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="p-5"
        >
          {/* Agent badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: `${step.highlight}12`, border: `1px solid ${step.highlight}30` }}>
              <span className="text-base leading-none">{step.agentIcon}</span>
              <span className="text-[11px] font-bold" style={{ color: step.highlight }}>{step.agent}</span>
            </div>
            {playing && (
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ background: 'rgba(0,245,160,0.08)', border: '1px solid rgba(0,245,160,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold">ACTIVE</span>
              </motion.div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-bold text-white mb-2 leading-tight">{step.title}</h3>

          {/* Narrative */}
          <p className="text-[12px] text-white/55 leading-relaxed">{step.narrative}</p>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {DEMO_SCRIPT.map((s, i) => (
              <button key={s.id} onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); setCurrentStep(i); setPlaying(false); }}
                className="transition-all duration-300 rounded-full"
                style={{
                  width:  i === currentStep ? '20px' : '6px',
                  height: '6px',
                  background: i < currentStep ? '#00f5a0'
                    : i === currentStep ? step.highlight
                    : 'rgba(255,255,255,0.15)',
                }} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="mx-5 mb-4">
        <div className="h-1 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            style={{ background: `linear-gradient(90deg, ${step.highlight}80, ${step.highlight})` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-5 pb-5">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={handlePlay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold"
            style={{
              background: playing
                ? 'rgba(251,146,60,0.15)'
                : `linear-gradient(135deg, ${step.highlight}, ${step.highlight}aa)`,
              color: playing ? '#fb923c' : '#020409',
              border: playing ? '1px solid rgba(251,146,60,0.3)' : 'none',
              boxShadow: playing ? 'none' : `0 0 20px ${step.highlight}40`,
            }}>
            {playing
              ? <><Pause size={13} /> Pause</>
              : completed
                ? <><Play size={13} /> Replay Demo</>
                : <><Play size={13} /> {currentStep === 0 ? 'Start Demo' : 'Resume'}</>
            }
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.45)',
            }}>
            <SkipForward size={13} />
            Next
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <ChevronRight size={11} className="text-white/20" />
          <span className="text-[10px] font-mono text-white/25">
            {step.duration / 1000}s per step
          </span>
        </div>
      </div>
    </div>
  );
}
