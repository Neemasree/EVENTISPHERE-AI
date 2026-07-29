import { motion } from 'framer-motion';
import CrowdStats from '../components/crowd/CrowdStats';
import CrowdAgentPanel from '../components/crowd/CrowdAgentPanel';

export default function CrowdPage() {
  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h1 className="page-title">Crowd Intelligence</h1>
        <p className="page-subtitle">Live zone metrics and real-time entrance monitoring</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <p className="section-label">Entrance Monitor</p>
        <CrowdAgentPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
        <p className="section-label">Live Metrics</p>
        <CrowdStats />
      </motion.div>
    </div>
  );
}
