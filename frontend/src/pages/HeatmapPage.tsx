import CrowdHeatmap from '../components/heatmap/CrowdHeatmap';

export default function HeatmapPage() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-title">Crowd Heatmap</h1>
        <p className="page-subtitle">Real-time heat intensity map — colors update live as crowd density changes</p>
      </div>
      <CrowdHeatmap />
    </div>
  );
}
