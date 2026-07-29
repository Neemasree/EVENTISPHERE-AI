import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, MapPin, Calendar, Users, Radio, ChevronRight, Pencil, ChevronLeft, Layers } from 'lucide-react';
import { useEventStore } from '../store/eventStore';
import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import DigitalTwinBuilder from '../components/builder/DigitalTwinBuilder';
import CrowdStats from '../components/crowd/CrowdStats';
import type { Event, Zone } from '../types';

const STATUS_CFG = {
  live:     { color: '#00f5a0', label: 'Live',     dot: true  },
  upcoming: { color: '#00d4ff', label: 'Upcoming', dot: false },
  ended:    { color: 'rgba(255,255,255,0.25)', label: 'Ended', dot: false },
};

export default function VenuePage() {
  const { events, activeEventId, setActiveEvent, addEvent, setZones } = useEventStore();
  const activeEvent = events.find(e => e.id === activeEventId) ?? events[0];

  const [showAdd, setShowAdd]   = useState(false);
  const [editTwin, setEditTwin] = useState(false);
  const [form, setForm]         = useState({ name: '', location: '', date: '', capacity: '' });
  const [formErr, setFormErr]   = useState('');

  const handleSaveTwin = (finalZones: Zone[]) => {
    setZones(finalZones);
    setEditTwin(false);
  };

  const handleAdd = () => {
    if (!form.name.trim())     return setFormErr('Event name is required.');
    if (!form.location.trim()) return setFormErr('Location is required.');
    if (!form.date)            return setFormErr('Date is required.');
    if (!form.capacity || isNaN(+form.capacity) || +form.capacity < 1)
      return setFormErr('Enter a valid capacity.');
    setFormErr('');
    const newEvent: Event = {
      id: `ev_${Date.now()}`,
      name: form.name.trim(),
      location: form.location.trim(),
      date: form.date,
      status: new Date(form.date) > new Date() ? 'upcoming' : 'live',
      totalCapacity: +form.capacity,
      zones: [],
    };
    addEvent(newEvent);
    setForm({ name: '', location: '', date: '', capacity: '' });
    setShowAdd(false);
  };

  return (
    <div className="space-y-5 w-full max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Venue Map</h1>
          <p className="page-subtitle">Interactive zone map — click any zone for live details</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.1))',
            border: '1px solid rgba(0,212,255,0.25)',
            color: '#00d4ff',
          }}>
          <Plus size={13} /> Add Event
        </motion.button>
      </div>

      {/* Event switcher */}
      <div className="flex gap-2.5 flex-wrap">
        {events.map(ev => {
          const cfg = STATUS_CFG[ev.status];
          const isActive = ev.id === activeEventId;
          return (
            <motion.button key={ev.id}
              whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveEvent(ev.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
              style={{
                background: isActive ? `${cfg.color}10` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isActive ? `0 0 20px ${cfg.color}15` : 'none',
                minWidth: 190,
              }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  {cfg.dot
                    ? <span className="live-dot w-1.5 h-1.5 flex-shrink-0" />
                    : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  }
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <p className="text-[13px] font-bold text-white truncate leading-tight">{ev.name}</p>
                <p className="text-[10px] text-white/35 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin size={9} /> {ev.location}
                </p>
              </div>
              {isActive && <ChevronRight size={13} style={{ color: cfg.color, flexShrink: 0 }} />}
            </motion.button>
          );
        })}
      </div>

      {/* Active event info bar */}
      {activeEvent && (
        <div className="flex items-center gap-4 flex-wrap px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 text-[11px]">
            <Radio size={11} className="text-cyan-400" />
            <span className="font-bold text-white/70">{activeEvent.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
            <MapPin size={10} /> {activeEvent.location}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
            <Calendar size={10} /> {new Date(activeEvent.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-white/35">
            <Users size={10} /> {activeEvent.totalCapacity.toLocaleString()} capacity
          </div>
          {activeEvent.zones.length === 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-lg ml-auto"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
              ⚠ No zones configured yet
            </span>
          )}
        </div>
      )}

      {/* Edit Twin full-screen overlay — portalled to body to escape overflow:hidden */}
      {editTwin && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col" style={{ background: '#020810', zIndex: 9999 }}>
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ background: 'rgba(6,12,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <Layers size={13} style={{ color: '#00d4ff' }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white leading-none">Edit Digital Twin</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{activeEvent?.name}</p>
                </div>
              </div>
              <button onClick={() => setEditTwin(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronLeft size={12} /> Back
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <DigitalTwinBuilder
                initialZones={activeEvent?.zones ?? []}
                onSave={handleSaveTwin}
              />
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Map + stats */}
      {activeEvent?.zones.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-1">
            <span />
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setEditTwin(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
              <Pencil size={11} /> Edit Digital Twin
            </motion.button>
          </div>
          <DigitalTwinVenue />
          <CrowdStats />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-4xl mb-4">🗺️</span>
          <p className="text-[14px] font-bold text-white/50 mb-1">No venue map for this event</p>
          <p className="text-[12px] text-white/25">Use the Digital Twin Builder to add zones</p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setEditTwin(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(168,85,247,0.1))', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
            <Pencil size={13} /> Open Digital Twin Builder
          </motion.button>
        </div>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowAdd(false)}>
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,16,32,0.98)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 30px 80px rgba(0,0,0,0.7)' }}>

              <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)' }} />

              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <p className="text-[15px] font-bold text-white">Add New Event</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Register a new event to monitor</p>
                </div>
                <button onClick={() => setShowAdd(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <X size={14} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {([
                  { key: 'name',     label: 'Event Name',     placeholder: 'e.g. Summer Music Festival', type: 'text'   },
                  { key: 'location', label: 'Location',       placeholder: 'e.g. Central Arena, Mumbai', type: 'text'   },
                  { key: 'date',     label: 'Event Date',     placeholder: '',                            type: 'date'   },
                  { key: 'capacity', label: 'Total Capacity', placeholder: 'e.g. 15000',                 type: 'number' },
                ] as const).map(f => (
                  <div key={f.key}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1.5">{f.label}</p>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="input-field text-sm w-full"
                    />
                  </div>
                ))}

                {formErr && (
                  <p className="text-[11px] px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>
                    ⚠ {formErr}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAdd}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-bold"
                    style={{ background: 'linear-gradient(135deg,#00d4ff,#0088cc)', color: '#020409', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
                    Create Event
                  </motion.button>
                  <button onClick={() => setShowAdd(false)}
                    className="px-4 py-2.5 rounded-xl text-[12px] text-white/40 hover:text-white/70 transition-colors"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
