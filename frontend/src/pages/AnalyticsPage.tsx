import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import { Download, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Analytics & Insights</h1>
          <p className="page-subtitle">Charts, trends, and AI-generated insights across all operational areas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="btn-ghost gap-2">
          <Download size={14} /> Export PDF
        </motion.button>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
