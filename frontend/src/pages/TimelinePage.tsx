import AITimeline from '../components/timeline/AITimeline';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';

export default function TimelinePage() {
  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-title">AI Decision Timeline</h1>
        <p className="page-subtitle">Chronological record of every AI decision, alert, and agent action</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <p className="section-label">Event Timeline</p>
          <div className="glass-card p-5">
            <AITimeline />
          </div>
        </div>
        <div>
          <p className="section-label">Agent Communications</p>
          <AgentCommsPanel />
        </div>
      </div>
    </div>
  );
}
