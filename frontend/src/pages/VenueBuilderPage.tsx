import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '../store/eventStore';
import TemplateSelector, { type Template, TEMPLATES } from '../components/builder/TemplateSelector';
import DigitalTwinBuilder from '../components/builder/DigitalTwinBuilder';
import type { Zone, Event } from '../types';

const STEPS = ['Event Details', 'Choose Template', 'Build Twin'];

export default function VenueBuilderPage() {
  const navigate = useNavigate();
  const { addEvent, setActiveEvent } = useEventStore();

  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState({ name: '', location: '', date: '', capacity: '' });
  const [formErr, setFormErr] = useState('');
  const [template, setTemplate] = useState<Template | null>(null);
  const [zones, setZones]     = useState<Zone[]>([]);

  const validateStep0 = () => {
    if (!form.name.trim())     return setFormErr('Event name is required.');
    if (!form.location.trim()) return setFormErr('Location is required.');
    if (!form.date)            return setFormErr('Date is required.');
    if (!form.capacity || isNaN(+form.capacity) || +form.capacity < 1)
      return setFormErr('Enter a valid capacity.');
    setFormErr('');
    setStep(1);
  };

  const handleTemplateSelect = (t: Template) => {
    setTemplate(t);
    setZones(t.zones.map(z => ({ ...z, currentCrowd: 0, occupancy: 0, waitingTime: 0, riskLevel: 'low' as const })));
    setStep(2);
  };

  const handleSave = (finalZones: Zone[]) => {
    const newEvent: Event = {
      id: `ev_${Date.now()}`,
      name: form.name.trim(),
      location: form.location.trim(),
      date: form.date,
      status: new Date(form.date) > new Date() ? 'upcoming' : 'live',
      totalCapacity: +form.capacity,
      zones: finalZones,
    };
    addEvent(newEvent);
    setActiveEvent(newEvent.id);
    navigate('/venue');
  };

  // Step 2 is full-screen builder
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col" style={{ background: '#020810' }}>
        {/* Builder header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ background: 'rgba(6,12,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Layers size={13} style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white leading-none">Digital Twin Builder</p>
              <p className="text-[10px] text-white/30 mt-0.5">{form.name} · {template?.label}</p>
            </div>
          </div>
          <button onClick={() => setStep(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronLeft size={12} /> Back
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <DigitalTwinBuilder initialZones={zones} onSave={handleSave} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="page-title">Create Digital Twin</h1>
        <p className="page-subtitle">Build your venue from scratch or choose a template</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={i < step ? { background: '#00f5a0', color: '#020409' }
                  : i === step ? { background: 'rgba(0,212,255,0.2)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.4)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-[11px] font-semibold hidden sm:block"
                style={{ color: i === step ? '#fff' : 'rgba(255,255,255,0.3)' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px mx-1" style={{ background: i < step ? 'rgba(0,245,160,0.4)' : 'rgba(255,255,255,0.08)' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[14px] font-bold text-white">Event Details</p>

            {[
              { key: 'name',     label: 'Event Name',     placeholder: 'e.g. Chennai Tech Summit',   type: 'text'   },
              { key: 'location', label: 'Venue / Location',placeholder: 'e.g. Chennai Trade Centre', type: 'text'   },
              { key: 'date',     label: 'Event Date',     placeholder: '',                            type: 'date'   },
              { key: 'capacity', label: 'Total Capacity', placeholder: 'e.g. 10000',                 type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">{f.label}</p>
                <input type={f.type} value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} className="input-field text-sm w-full" />
              </div>
            ))}

            {formErr && (
              <p className="text-[11px] px-3 py-2 rounded-xl"
                style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
                ⚠ {formErr}
              </p>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={validateStep0}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold"
              style={{ background: 'linear-gradient(135deg,#00d4ff,#0088cc)', color: '#020409', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
              Next — Choose Template <ChevronRight size={14} />
            </motion.button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-white">Choose a Template</p>
              <button onClick={() => setStep(0)}
                className="flex items-center gap-1 text-[11px] text-white/35 hover:text-white/70 transition-colors">
                <ChevronLeft size={12} /> Back
              </button>
            </div>
            <TemplateSelector onSelect={handleTemplateSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
