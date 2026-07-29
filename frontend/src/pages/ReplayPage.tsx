import EventReplay from '../components/analytics/EventReplay';
import AITimeline from '../components/timeline/AITimeline';

export default function ReplayPage() {
  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-title">Event Replay</h1>
        <p className="page-subtitle">Scrub through the full event — watch crowd dynamics, alerts, and AI decisions unfold</p>
      </div>
      <EventReplay />
      <div>
        <p className="section-label">Corresponding Timeline</p>
        <div className="glass-card p-5">
          <AITimeline />
        </div>
      </div>
    </div>
  );
}
