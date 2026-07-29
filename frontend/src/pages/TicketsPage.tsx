import TicketScanner from '../components/tickets/TicketScanner';
import { motion } from 'framer-motion';
import { useEventStore } from '../store/eventStore';
import { Shield, Scan, CheckCircle } from 'lucide-react';

export default function TicketsPage() {
  const agents = useEventStore(s => s.agents);
  const ticketAgent = agents.find(a => a.id === 'ticket');

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Ticket Verification</h1>
          <p className="page-subtitle">AI-powered QR scanning, duplicate detection, and entry management</p>
        </div>
        {ticketAgent && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <span className="text-lg">🎫</span>
            <div>
              <p className="text-[11px] font-bold text-blue-400">Ticket Agent</p>
              <p className="text-[9px] text-white/30 font-mono">{ticketAgent.messagesProcessed.toLocaleString()} verified</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Scan size={16} />,       label: 'Total Scanned',   value: '14,834', color: '#00d4ff' },
          { icon: <CheckCircle size={16} />, label: 'Verified',        value: '14,832', color: '#00f5a0' },
          { icon: <Shield size={16} />,     label: 'Fraud Blocked',   value: '2',      color: '#f43f5e' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-4 text-center relative overflow-hidden"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}22` }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-px" style={{ background: s.color }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ease: [0.16, 1, 0.3, 1] }}>
        <TicketScanner />
      </motion.div>
    </div>
  );
}
