import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LoadingScreen from './components/loading/LoadingScreen';
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
import TicketsPage from './pages/TicketsPage';
import EmergencyPage from './pages/EmergencyPage';
import ParkingPage from './pages/ParkingPage';
import VenueBuilderPage from './pages/VenueBuilderPage';

function App() {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Cinematic loading screen — blocks app until boot sequence completes */}
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {/* Main app — rendered beneath loading screen, revealed on completion */}
      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease', pointerEvents: loaded ? 'all' : 'none' }}>
        <AppShell>
          <Routes>
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/venue"        element={<VenuePage />} />
            <Route path="/heatmap"      element={<HeatmapPage />} />
            <Route path="/crowd"        element={<CrowdPage />} />
            <Route path="/alerts"       element={<AlertsPage />} />
            <Route path="/analytics"    element={<AnalyticsPage />} />
            <Route path="/agents"       element={<AgentsPage />} />
            <Route path="/simulator"    element={<SimulatorPage />} />
            <Route path="/timeline"     element={<TimelinePage />} />
            <Route path="/notifications"element={<NotificationsPage />} />
            <Route path="/incidents"    element={<IncidentsPage />} />
            <Route path="/replay"       element={<ReplayPage />} />
            <Route path="/tickets"      element={<TicketsPage />} />
            <Route path="/parking"      element={<ParkingPage />} />
            <Route path="/emergency"    element={<EmergencyPage />} />
            <Route path="/builder"      element={<VenueBuilderPage />} />
            <Route path="*"             element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppShell>
      </div>
    </>
  );
}

export default App;
