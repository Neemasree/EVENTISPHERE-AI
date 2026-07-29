import ScenarioSimulator from '../components/simulator/ScenarioSimulator';
import DigitalTwinVenue from '../components/venue/DigitalTwinVenue';
import AlertCenter from '../components/alerts/AlertCenter';
import AgentCommsPanel from '../components/agents/AgentCommsPanel';

export default function SimulatorPage() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-title">Scenario Simulator</h1>
        <p className="page-subtitle">Trigger live scenarios and watch all 6 agents respond in real time across every panel</p>
      </div>
      <ScenarioSimulator />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <p className="section-label">Live Venue Response</p>
          <DigitalTwinVenue />
        </div>
        <div className="space-y-5">
          <div>
            <p className="section-label">Active Alerts</p>
            <div className="glass-card p-4">
              <AlertCenter maxItems={4} />
            </div>
          </div>
          <div>
            <p className="section-label">Agent Messages</p>
            <AgentCommsPanel compact />
          </div>
        </div>
      </div>
    </div>
  );
}
