import AITimeline from '../components/timeline/AITimeline';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';

export default function TimelinePage() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="page-header">AI Decision Timeline</h1>
        <p className="page-sub">Chronological record of every AI decision, alert, and agent action</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Event Timeline</p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <AITimeline />
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Agent Communications</p>
          <AgentCommsPanel />
        </div>
      </div>
    </div>
  );
}
