import CrowdHeatmap from '../components/heatmap/CrowdHeatmap';
import LiveCrowdAnimation from '../components/crowd/LiveCrowdAnimation';

export default function HeatmapPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-header">Crowd Heatmap</h1>
        <p className="page-sub">Real-time heat intensity map — colors update live as crowd density changes</p>
      </div>
      <CrowdHeatmap />
      <LiveCrowdAnimation />
    </div>
  );
}
