import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Download } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Analytics & Insights</h1>
          <p className="page-sub">Charts, trends, and AI-generated insights across all operational areas</p>
        </div>
        <button className="btn-ghost flex items-center gap-2">
          <Download size={14} /> Export PDF
        </button>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
