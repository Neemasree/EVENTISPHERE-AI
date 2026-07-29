import CrowdStats from '../components/crowd/CrowdStats';
import AIPredictions from '../components/ai/AIPredictions';
import RiskMeter from '../components/crowd/RiskMeter';

export default function CrowdPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-header">Crowd Intelligence</h1>
        <p className="page-sub">Zone-level crowd metrics, AI predictions, and risk assessment</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CrowdStats />
        </div>
        <div className="space-y-6">
          <RiskMeter />
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">AI Predictions</p>
            <AIPredictions />
          </div>
        </div>
      </div>
    </div>
  );
}
