import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Crowd ──────────────────────────────────────────────────────────────────
export const getCrowdStatus      = () => api.get('/crowd/status').then(r => r.data);
export const analyseCrowd        = (zones: any[]) => api.post('/crowd/analyse', { zones }).then(r => r.data);
export const getCrowdHistory     = () => api.get('/crowd/history').then(r => r.data);
export const getCrowdPredictions = () => api.get('/crowd/predictions').then(r => r.data);
export const getCrowdZones       = () => api.get('/crowd/zones').then(r => r.data);

// ── Alerts ─────────────────────────────────────────────────────────────────
export const getAlerts            = () => api.get('/alerts/').then(r => r.data);
export const createAlert          = (a: any) => api.post('/alerts/', a).then(r => r.data);
export const dismissAlert         = (id: string) => api.patch(`/alerts/${id}/dismiss`).then(r => r.data);
export const getRecommendations   = () => api.get('/alerts/recommendations').then(r => r.data);
export const applyRecommendation  = (id: string) => api.post(`/alerts/recommendations/${id}/apply`).then(r => r.data);

// ── Agents ─────────────────────────────────────────────────────────────────
export const getAgentsStatus  = () => api.get('/agents/status').then(r => r.data);
export const getAgentDecisions = () => api.get('/agents/decisions').then(r => r.data);
export const sendAgentMessage = (msg: any) => api.post('/agents/message', msg).then(r => r.data);
export const getAgentMessages = () => api.get('/agents/messages').then(r => r.data);

// ── Analytics ──────────────────────────────────────────────────────────────
export const getKPI          = () => api.get('/analytics/kpi').then(r => r.data);
export const getHourlyData   = () => api.get('/analytics/hourly').then(r => r.data);
export const getZoneAnalytics = () => api.get('/analytics/zones').then(r => r.data);
export const getReport       = () => api.get('/analytics/report').then(r => r.data);

// ── Tickets ──────────────────────────────────────────────────────────────
export const getTicketStats  = () => api.get('/tickets/stats').then(r => r.data);
export const verifyTicketApi = (ticketId: string, gate: string) => api.post('/tickets/verify', { ticketId, gate }).then(r => r.data);

// ── Parking ────────────────────────────────────────────────────────────────
export const getParkingAnalysis = () => api.get('/parking/analyse').then(r => r.data);
export const getParkingReport   = () => api.get('/parking/report').then(r => r.data);
export const rerouteParking     = (from_lot: string, to_lot: string) => api.post('/parking/reroute', { from_lot, to_lot }).then(r => r.data);

// ── Simulator ──────────────────────────────────────────────────────────────
export const triggerScenario = (scenario: string) =>
  api.post('/simulator/trigger', { scenario }).then(r => r.data);
export const getSimLogs = () => api.get('/simulator/logs').then(r => r.data);

// ── Zones ──────────────────────────────────────────────────────────────────
export const getZones      = () => api.get('/zones/').then(r => r.data);
export const getZoneDetail = (id: string) => api.get(`/zones/${id}`).then(r => r.data);
export const updateZone    = (id: string, data: any) => api.patch(`/zones/${id}/update`, data).then(r => r.data);

export default api;
