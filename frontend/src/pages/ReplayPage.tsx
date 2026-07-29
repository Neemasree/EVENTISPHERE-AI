import EventReplay from '../components/analytics/EventReplay';
import AITimeline from '../components/timeline/AITimeline';

export default function ReplayPage() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-header">Event Replay</h1>
        <p className="page-sub">Scrub through the full event — watch crowd dynamics, alerts, and AI decisions unfold</p>
      </div>
      <EventReplay />
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Corresponding Timeline</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <AITimeline />
        </div>
      </div>
    </div>
  );
}
