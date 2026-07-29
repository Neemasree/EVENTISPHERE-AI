import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import VenuePage from './pages/VenuePage';
import HeatmapPage from './pages/HeatmapPage';
import CrowdPage from './pages/CrowdPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AgentsPage from './pages/AgentsPage';
import SimulatorPage from './pages/SimulatorPage';
import TimelinePage from './pages/TimelinePage';
import NotificationsPage from './pages/NotificationsPage';
import IncidentsPage from './pages/IncidentsPage';
import ReplayPage from './pages/ReplayPage';

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/venue" element={<VenuePage />} />
        <Route path="/heatmap" element={<HeatmapPage />} />
        <Route path="/crowd" element={<CrowdPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/replay" element={<ReplayPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppShell>
  );
}

export default App;
