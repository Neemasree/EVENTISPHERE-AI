import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Loader2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useEventStore } from '../../store/eventStore';

const RISK_COLOR: Record<string, string> = {
  critical: '#f43f5e', high: '#fb923c', medium: '#fbbf24', low: '#00f5a0',
};

function buildSitrep(store: ReturnType<typeof useEventStore.getState>): string {
  const { zones, kpi, alerts, recommendations, predictions, incidents } = store;
  const activeAlerts  = alerts.filter(a => !a.dismissed);
  const pendingRecs   = recommendations.filter(r => !r.applied);
  const openIncidents = incidents.filter(i => !i.resolved);
  const criticalZones = zones.filter(z => z.riskLevel === 'critical');
  const highZones     = zones.filter(z => z.riskLevel === 'high');
  const topRec        = [...pendingRecs].sort((a, b) => b.confidence - a.confidence)[0];
  const topPred       = [...predictions].sort((a, b) =>
    ({ critical: 0, high: 1, medium: 2, low: 3 }[a.predictedRisk] ?? 4) -
    ({ critical: 0, high: 1, medium: 2, low: 3 }[b.predictedRisk] ?? 4)
  )[0];

  const riskEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[kpi.riskLevel] ?? '⚪';

  return [
    `## ${riskEmoji} Event Status: ${kpi.riskLevel === 'low' ? 'Stable' : kpi.riskLevel === 'medium' ? 'Elevated' : 'Critical'}`,
    `**Overall Risk:** ${kpi.riskLevel.toUpperCase()}`,
    `**Active Visitors:** ${kpi.currentCrowd.toLocaleString()} / ${kpi.totalCapacity.toLocaleString()} (${kpi.occupancyPercent}%)`,
    `**Avg Wait Time:** ${kpi.avgWaitTime} min | **Flow Rate:** ${kpi.flowRate}/min`,
    '',
    criticalZones.length > 0
      ? `**🚨 Critical Zones:**\n${criticalZones.map(z => `• ${z.name} — ${z.occupancy}% (${z.currentCrowd}/${z.maxCapacity})`).join('\n')}`
      : '**✅ No Critical Zones**',
    highZones.length > 0
      ? `**⚠️ High-Risk Zones:**\n${highZones.map(z => `• ${z.name} — ${z.occupancy}%`).join('\n')}`
      : '',
    '',
    `**Active Alerts:** ${activeAlerts.length} | **Open Incidents:** ${openIncidents.length}`,
    '',
    topPred
      ? `**📈 Predicted Congestion:**\n• ${topPred.zoneName} — currently ${topPred.current} → ${topPred.in10min} in 10 min (${topPred.confidence}% confidence)`
      : '',
    '',
    pendingRecs.length > 0
      ? `**🎯 Recommended Actions:**\n${pendingRecs.slice(0, 3).map((r, i) => `${i + 1}. ${r.action}`).join('\n')}`
      : '**✅ No pending actions required**',
    '',
    topRec
      ? `**📉 Estimated Improvement:** ${topRec.expectedReduction}% reduction in queue time (${topRec.confidence}% confidence)`
      : '',
  ].filter(l => l !== undefined).join('\n');
}

async function fetchSitrep(store: ReturnType<typeof useEventStore.getState>): Promise<string> {
  const { zones, kpi, alerts, recommendations, predictions, incidents } = store;
  const eventContext = {
    operationalSummary: {
      overallRisk:      kpi.riskLevel,
      activeVisitors:   kpi.currentCrowd,
      totalCapacity:    kpi.totalCapacity,
      occupancyPercent: kpi.occupancyPercent,
      avgWaitTimeMin:   kpi.avgWaitTime,
      peakZone:         kpi.peakZone,
      activeAlerts:     alerts.filter(a => !a.dismissed).length,
      criticalZones:    zones.filter(z => z.riskLevel === 'critical').length,
      openIncidents:    incidents.filter(i => !i.resolved).length,
    },
    zones: zones.map(z => ({
      name: z.name, occupancyPercent: z.occupancy,
      currentOccupancy: z.currentCrowd, capacity: z.maxCapacity,
      riskLevel: z.riskLevel, waitingTimeMin: z.waitingTime,
      forecast: predictions.find(p => p.zoneId === z.id) ?? null,
    })),
    alerts: alerts.filter(a => !a.dismissed).slice(0, 5).map(a => ({
      severity: a.severity, title: a.title, message: a.message,
    })),
    recommendations: recommendations.filter(r => !r.applied).slice(0, 4).map(r => ({
      title: r.title, action: r.action, zone: r.zone,
      expectedReduction: r.expectedReduction, confidence: r.confidence,
    })),
  };

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Generate a full executive situation report covering event status, risk level, critical zones, active alerts, predicted congestion, and top 3 recommended actions with expected improvement.',
        eventContext,
      }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.answer;
  } catch {
    return buildSitrep(store);
  }
}

export default function SituationReport() {
  const store = useEventStore();
  const { kpi } = store;
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [report,  setReport]  = useState('');

  const generate = async () => {
    setOpen(true);
    setLoading(true);
    setReport('');
    const text = await fetchSitrep(store);
    setReport(text);
    setLoading(false);
  };

  const riskColor = RISK_COLOR[kpi.riskLevel] ?? '#00f5a0';

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={generate}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold"
        style={{
          background: `${riskColor}12`,
          border: `1px solid ${riskColor}35`,
          color: riskColor,
          boxShadow: `0 0 16px ${riskColor}15`,
        }}>
        <FileText size={13} /> Situation Report
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setOpen(false)}>
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,16,32,0.98)', border: '1px solid rgba(0,212,255,0.2)', boxShadow: '0 0 60px rgba(0,212,255,0.1), 0 30px 80px rgba(0,0,0,0.7)' }}>

              <div className="h-px" style={{ background: 'linear-gradient(90deg,transparent,#00d4ff,#a855f7,transparent)' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30` }}>
                    <FileText size={15} style={{ color: riskColor }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-white">Situation Report</p>
                    <p className="text-[10px] text-white/30 mt-0.5 font-mono">AI-generated · {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Risk badge */}
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase"
                    style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30`, color: riskColor }}>
                    {kpi.riskLevel === 'critical' || kpi.riskLevel === 'high'
                      ? <AlertTriangle size={10} />
                      : <CheckCircle size={10} />}
                    {kpi.riskLevel}
                  </span>
                  <button onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={28} style={{ color: '#00d4ff' }} />
                    </motion.div>
                    <p className="text-[12px] text-white/40 font-mono">Analysing live event data...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none
                    [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-cyan-300 [&_h2]:mb-2 [&_h2]:mt-0
                    [&_strong]:text-white/90 [&_strong]:font-semibold
                    [&_p]:text-white/75 [&_p]:text-[12px] [&_p]:leading-relaxed [&_p]:mb-2
                    [&_ul]:pl-4 [&_ul]:mb-2 [&_li]:text-white/70 [&_li]:text-[12px] [&_li]:mb-1
                    [&_ol]:pl-4 [&_ol]:mb-2">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && (
                <div className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-cyan-400" />
                    <span className="text-[10px] text-white/30 font-mono">
                      {store.zones.length} zones · {store.alerts.filter(a => !a.dismissed).length} alerts · live data
                    </span>
                  </div>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={generate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                    style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                    Refresh
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
