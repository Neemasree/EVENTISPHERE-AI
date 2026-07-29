import ScenarioSimulator from '../components/simulator/ScenarioSimulator';
import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import AlertCenter from '../components/alerts/AlertCenter';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';

export default function SimulatorPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-header">Scenario Simulator</h1>
        <p className="page-sub">Trigger live scenarios and watch all 6 agents respond in real time across every panel</p>
      </div>
      <ScenarioSimulator />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Live Venue Response</p>
          <DigitalTwinVenue />
        </div>
        <div className="space-y-6">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Active Alerts</p>
            <AlertCenter maxItems={4} />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Agent Messages</p>
            <AgentCommsPanel compact />
          </div>
        </div>
      </div>
    </div>
  );
}
