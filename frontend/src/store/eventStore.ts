import { create } from 'zustand';
import type {
  Zone, Alert, Recommendation, Prediction, Agent, AgentMessage,
  TimelineEvent, KPIData, Notification, Incident, ChatMessage, RiskLevel, ScenarioType
} from '../types';

const initialZones: Zone[] = [
  { id: 'parking_a', name: 'Parking A', type: 'parking', currentCrowd: 420, maxCapacity: 500, occupancy: 84, waitingTime: 5, riskLevel: 'high', x: 20, y: 20, width: 120, height: 60 },
  { id: 'parking_b', name: 'Parking B', type: 'parking', currentCrowd: 180, maxCapacity: 500, occupancy: 36, waitingTime: 1, riskLevel: 'low', x: 160, y: 20, width: 120, height: 60 },
  { id: 'gate_a', name: 'Gate A', type: 'gate', currentCrowd: 380, maxCapacity: 500, occupancy: 76, waitingTime: 8, riskLevel: 'high', x: 20, y: 100, width: 80, height: 50 },
  { id: 'gate_b', name: 'Gate B', type: 'gate', currentCrowd: 120, maxCapacity: 500, occupancy: 24, waitingTime: 2, riskLevel: 'low', x: 115, y: 100, width: 80, height: 50 },
  { id: 'gate_c', name: 'Gate C', type: 'gate', currentCrowd: 90, maxCapacity: 500, occupancy: 18, waitingTime: 1, riskLevel: 'low', x: 210, y: 100, width: 80, height: 50 },
  { id: 'vip', name: 'VIP Lounge', type: 'vip', currentCrowd: 45, maxCapacity: 150, occupancy: 30, waitingTime: 0, riskLevel: 'low', x: 310, y: 20, width: 100, height: 60 },
  { id: 'main_stage', name: 'Main Stage', type: 'stage', currentCrowd: 3200, maxCapacity: 5000, occupancy: 64, waitingTime: 0, riskLevel: 'medium', x: 100, y: 175, width: 220, height: 120 },
  { id: 'food_court', name: 'Food Court', type: 'food', currentCrowd: 520, maxCapacity: 600, occupancy: 87, waitingTime: 12, riskLevel: 'critical', x: 340, y: 100, width: 120, height: 75 },
  { id: 'medical', name: 'Medical Bay', type: 'medical', currentCrowd: 8, maxCapacity: 50, occupancy: 16, waitingTime: 3, riskLevel: 'low', x: 340, y: 190, width: 80, height: 50 },
  { id: 'restrooms', name: 'Restrooms', type: 'restroom', currentCrowd: 95, maxCapacity: 120, occupancy: 79, waitingTime: 6, riskLevel: 'high', x: 340, y: 255, width: 80, height: 45 },
  { id: 'exit_main', name: 'Main Exit', type: 'exit', currentCrowd: 140, maxCapacity: 400, occupancy: 35, waitingTime: 2, riskLevel: 'low', x: 20, y: 310, width: 100, height: 45 },
  { id: 'emergency_exit', name: 'Emergency Exit', type: 'emergency_exit', currentCrowd: 0, maxCapacity: 1000, occupancy: 0, waitingTime: 0, riskLevel: 'low', x: 440, y: 175, width: 80, height: 50 },
];

const initialAgents: Agent[] = [
  { id: 'orchestrator', name: 'Orchestrator', status: 'active', lastAction: 'Coordinating cross-agent alerts', messagesProcessed: 284, icon: '🧠' },
  { id: 'crowd', name: 'Crowd Agent', status: 'alert', lastAction: 'Food Court at 87% — predicting overflow in 4 min', messagesProcessed: 512, icon: '👥' },
  { id: 'parking', name: 'Parking Agent', status: 'processing', lastAction: 'Redirecting vehicles from Lot A → Lot B', messagesProcessed: 198, icon: '🚗' },
  { id: 'gate', name: 'Gate Agent', status: 'active', lastAction: 'Gate C opened — distributing load', messagesProcessed: 341, icon: '🚪' },
  { id: 'ticket', name: 'Ticket Agent', status: 'active', lastAction: 'Verified 14,832 tickets — 2 duplicates blocked', messagesProcessed: 14834, icon: '🎫' },
  { id: 'emergency', name: 'Emergency Agent', status: 'idle', lastAction: 'All teams on standby — no active incidents', messagesProcessed: 47, icon: '🚨' },
  { id: 'analytics', name: 'Analytics Agent', status: 'active', lastAction: 'Generating peak-hour trend report', messagesProcessed: 891, icon: '📊' },
];

const now = new Date();
const ts = (offsetMin: number) => new Date(now.getTime() - offsetMin * 60000);

const initialTimeline: TimelineEvent[] = [
  { id: 't1', time: ts(45), title: 'Event Started', description: 'All systems nominal. 2,400 visitors entered.', type: 'normal', agent: 'orchestrator' },
  { id: 't2', time: ts(32), title: 'Parking A Surge', description: 'Parking A hit 70%. Agents alerted.', type: 'warning', agent: 'parking' },
  { id: 't3', time: ts(28), title: 'Queue Prediction', description: 'Gate A predicted to exceed capacity in 6 min.', type: 'warning', agent: 'crowd' },
  { id: 't4', time: ts(25), title: 'Gate C Opened', description: 'Gate Agent opened Gate C. Crowd redistributed.', type: 'action', agent: 'gate' },
  { id: 't5', time: ts(18), title: 'Crowd Reduced', description: 'Gate A occupancy dropped to 76%. Risk lowered.', type: 'resolved', agent: 'crowd' },
  { id: 't6', time: ts(8), title: 'Food Court Alert', description: 'Food Court at 87%. Critical alert generated.', type: 'critical', agent: 'crowd' },
  { id: 't7', time: ts(2), title: 'Recommendation Sent', description: 'Opening stall 3 recommended. Awaiting approval.', type: 'action', agent: 'orchestrator' },
];

const initialAlerts: Alert[] = [
  { id: 'a1', severity: 'critical', title: 'Food Court Overflow Imminent', message: 'Food Court at 87% capacity. Predicted overflow in 4 minutes.', zone: 'Food Court', timestamp: ts(2), read: false, dismissed: false },
  { id: 'a2', severity: 'high', title: 'Gate A Queue Building', message: 'Gate A queue: 380 people. Waiting time 8 min.', zone: 'Gate A', timestamp: ts(8), read: false, dismissed: false },
  { id: 'a3', severity: 'high', title: 'Parking A Near Full', message: 'Parking A at 84%. Recommend routing to Lot B.', zone: 'Parking A', timestamp: ts(15), read: true, dismissed: false },
  { id: 'a4', severity: 'medium', title: 'Restroom Queue', message: 'Restrooms at 79% capacity. Average wait 6 min.', zone: 'Restrooms', timestamp: ts(20), read: true, dismissed: false },
  { id: 'a5', severity: 'low', title: 'System Update', message: 'Hourly analytics snapshot saved to database.', timestamp: ts(30), read: true, dismissed: false },
];

const initialRecommendations: Recommendation[] = [
  { id: 'r1', title: 'Open Food Stall 3', description: 'Food Court at 87%. Opening stall 3 will reduce queue density.', action: 'Open Food Stall 3 immediately', zone: 'Food Court', expectedReduction: 28, estimatedTime: 3, confidence: 97, applied: false, timestamp: ts(2) },
  { id: 'r2', title: 'Reroute Parking to Lot B', description: 'Parking A at 84%. Rerouting inbound vehicles prevents overflow.', action: 'Display "Use Lot B" signs at Parking A entrance', zone: 'Parking A', expectedReduction: 35, estimatedTime: 2, confidence: 94, applied: false, timestamp: ts(5) },
  { id: 'r3', title: 'Open Gate C', description: 'Gate A queue building. Gate C has 18% load — optimal redirect target.', action: 'Open Gate C and display signage', zone: 'Gate A', expectedReduction: 31, estimatedTime: 2, confidence: 96, applied: true, timestamp: ts(25) },
];

const initialPredictions: Prediction[] = [
  { zoneId: 'gate_a', zoneName: 'Gate A', current: 380, in5min: 430, in10min: 510, in30min: 480, predictedRisk: 'critical', confidence: 94, capacity: 500 },
  { zoneId: 'food_court', zoneName: 'Food Court', current: 520, in5min: 580, in10min: 600, in30min: 550, predictedRisk: 'critical', confidence: 97, capacity: 600 },
  { zoneId: 'parking_a', zoneName: 'Parking A', current: 420, in5min: 460, in10min: 490, in30min: 500, predictedRisk: 'high', confidence: 89, capacity: 500 },
  { zoneId: 'main_stage', zoneName: 'Main Stage', current: 3200, in5min: 3400, in10min: 3700, in30min: 4200, predictedRisk: 'medium', confidence: 82, capacity: 5000 },
];

export interface EventState {
  // Data
  zones: Zone[];
  alerts: Alert[];
  recommendations: Recommendation[];
  predictions: Prediction[];
  agents: Agent[];
  agentMessages: AgentMessage[];
  timeline: TimelineEvent[];
  notifications: Notification[];
  incidents: Incident[];
  chatMessages: ChatMessage[];

  // KPI
  kpi: KPIData;

  // UI
  selectedZone: Zone | null;
  isMuted: boolean;
  isDarkMode: boolean;
  sidebarOpen: boolean;
  activeScenario: ScenarioType | null;

  // Actions
  setSelectedZone: (zone: Zone | null) => void;
  applyRecommendation: (id: string) => void;
  dismissAlert: (id: string) => void;
  readAlert: (id: string) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  addTimelineEvent: (evt: TimelineEvent) => void;
  addAlert: (alert: Alert) => void;
  addNotification: (n: Notification) => void;
  triggerScenario: (scenario: ScenarioType) => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleMute: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  tickLiveData: () => void;
}

const computeKPI = (zones: Zone[], alerts: Alert[], recs: Recommendation[]): KPIData => {
  const totalCrowd = zones.reduce((s, z) => s + z.currentCrowd, 0);
  const totalCap = zones.reduce((s, z) => s + z.maxCapacity, 0);
  const occupancy = Math.round((totalCrowd / totalCap) * 100);
  const activeAlerts = alerts.filter(a => !a.dismissed).length;
  const avgWait = Math.round(zones.reduce((s, z) => s + z.waitingTime, 0) / zones.length);
  const peakZone = zones.reduce((a, b) => a.occupancy > b.occupancy ? a : b).name;
  const criticalCount = zones.filter(z => z.riskLevel === 'critical').length;
  const highCount = zones.filter(z => z.riskLevel === 'high').length;
  const riskLevel: RiskLevel = criticalCount > 0 ? 'critical' : highCount > 1 ? 'high' : highCount > 0 ? 'medium' : 'low';
  return {
    currentCrowd: totalCrowd, totalCapacity: totalCap, occupancyPercent: occupancy,
    activeAlerts, aiRecommendations: recs.filter(r => !r.applied).length,
    avgWaitTime: avgWait, peakZone, riskLevel, agentStatus: 'active', flowRate: 240,
  };
};

export const useEventStore = create<EventState>((set, get) => ({
  zones: initialZones,
  alerts: initialAlerts,
  recommendations: initialRecommendations,
  predictions: initialPredictions,
  agents: initialAgents,
  agentMessages: [],
  timeline: initialTimeline,
  notifications: [],
  incidents: [
    { id: 'i1', severity: 'medium', zone: 'Gate A', time: ts(60), description: 'Queue buildup at Gate A', actionTaken: 'Opened Gate C — crowd redistributed', resolved: true, responseTime: 3 },
    { id: 'i2', severity: 'low', zone: 'Parking A', time: ts(45), description: 'Parking A 70% full', actionTaken: 'Signage updated to route to Lot B', resolved: true, responseTime: 2 },
    { id: 'i3', severity: 'critical', zone: 'Food Court', time: ts(8), description: 'Food Court overflow imminent', actionTaken: 'Opening stall 3 — pending approval', resolved: false, responseTime: 0 },
  ],
  chatMessages: [
    { id: 'c0', role: 'assistant', content: 'Hello! I\'m your EventSphere AI assistant. Ask me anything about the current event — crowd status, predictions, or recommendations.', timestamp: ts(1) },
  ],
  kpi: computeKPI(initialZones, initialAlerts, initialRecommendations),
  selectedZone: null,
  isMuted: false,
  isDarkMode: true,
  sidebarOpen: true,
  activeScenario: null,

  setSelectedZone: (zone) => set({ selectedZone: zone }),
  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
  toggleDarkMode: () => set(s => ({ isDarkMode: !s.isDarkMode })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  applyRecommendation: (id) => set(s => {
    const recs = s.recommendations.map(r => r.id === id ? { ...r, applied: true } : r);
    const rec = recs.find(r => r.id === id);
    const newMsg: AgentMessage = {
      id: `msg_${Date.now()}`, from: 'orchestrator', to: 'crowd',
      message: `Recommendation applied: ${rec?.action}`, timestamp: new Date(), type: 'action', animated: true,
    };
    const newEvt: TimelineEvent = {
      id: `te_${Date.now()}`, time: new Date(),
      title: `Applied: ${rec?.title}`, description: `${rec?.action} — Expected ${rec?.expectedReduction}% reduction.`,
      type: 'action', agent: 'orchestrator',
    };
    return { recommendations: recs, agentMessages: [...s.agentMessages, newMsg], timeline: [...s.timeline, newEvt], kpi: computeKPI(s.zones, s.alerts, recs) };
  }),

  dismissAlert: (id) => set(s => {
    const alerts = s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a);
    return { alerts, kpi: computeKPI(s.zones, alerts, s.recommendations) };
  }),
  readAlert: (id) => set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, read: true } : a) })),
  addAgentMessage: (msg) => set(s => ({ agentMessages: [...s.agentMessages.slice(-49), msg] })),
  addTimelineEvent: (evt) => set(s => ({ timeline: [...s.timeline, evt] })),
  addAlert: (alert) => set(s => {
    const alerts = [alert, ...s.alerts];
    return { alerts, kpi: computeKPI(s.zones, alerts, s.recommendations) };
  }),
  addNotification: (n) => set(s => ({ notifications: [n, ...s.notifications] })),
  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),

  tickLiveData: () => set(s => {
    const nudge = (v: number, max: number) => Math.min(max, Math.max(0, v + Math.floor((Math.random() - 0.48) * 12)));
    const zones = s.zones.map(z => {
      const c = nudge(z.currentCrowd, z.maxCapacity);
      const occ = Math.round((c / z.maxCapacity) * 100);
      const risk: RiskLevel = occ >= 95 ? 'critical' : occ >= 80 ? 'high' : occ >= 60 ? 'medium' : 'low';
      return { ...z, currentCrowd: c, occupancy: occ, riskLevel: risk };
    });
    return { zones, kpi: computeKPI(zones, s.alerts, s.recommendations) };
  }),

  triggerScenario: (scenario) => {
    const { zones, alerts, recommendations, timeline, agentMessages } = get();
    let newZones = [...zones];
    let newAlerts = [...alerts];
    let newTimeline = [...timeline];
    let newMsgs = [...agentMessages];
    const now2 = new Date();
    const addEvt = (title: string, desc: string, type: TimelineEvent['type'], agent: TimelineEvent['agent'] = 'orchestrator') => {
      newTimeline = [...newTimeline, { id: `te_${Date.now()}_${Math.random()}`, time: now2, title, description: desc, type, agent }];
    };
    const addMsg = (from: AgentMessage['from'], to: AgentMessage['to'], message: string, type: AgentMessage['type'] = 'info') => {
      newMsgs = [...newMsgs, { id: `msg_${Date.now()}_${Math.random()}`, from, to, message, timestamp: now2, type, animated: true }];
    };
    if (scenario === 'add_50') { newZones = newZones.map(z => ({ ...z, currentCrowd: z.currentCrowd + Math.floor(50 / newZones.length) })); addEvt('+50 Visitors', '50 visitors added across all zones.', 'normal'); }
    else if (scenario === 'add_100') { newZones = newZones.map(z => ({ ...z, currentCrowd: z.currentCrowd + Math.floor(100 / newZones.length) })); addEvt('+100 Visitors', '100 visitors entered the venue.', 'warning'); }
    else if (scenario === 'add_500') { newZones = newZones.map(z => ({ ...z, currentCrowd: z.currentCrowd + Math.floor(500 / newZones.length) })); addEvt('+500 Visitors', '500 visitors arrived — crowd density rising.', 'critical', 'crowd'); addMsg('crowd', 'orchestrator', 'Major visitor influx detected. Crowd density rising.', 'warning'); addMsg('orchestrator', 'gate', 'Open all available gates immediately.', 'action'); }
    else if (scenario === 'bus_arrives') {
      newZones = newZones.map(z => z.id === 'gate_a' ? { ...z, currentCrowd: Math.min(z.maxCapacity, z.currentCrowd + 180) } : z);
      newAlerts = [{ id: `a_${Date.now()}`, severity: 'high', title: 'Bus Arrived at Gate A', message: 'Coach bus dropped 180 visitors at Gate A.', zone: 'Gate A', timestamp: now2, read: false, dismissed: false }, ...newAlerts];
      addEvt('Bus Arrived', '180 passengers arriving at Gate A.', 'warning', 'crowd');
      addMsg('crowd', 'orchestrator', 'Bus arrival: Gate A +180 visitors.', 'warning');
      addMsg('orchestrator', 'gate', 'Open Gate B and C to absorb bus arrival.', 'action');
    }
    else if (scenario === 'rain_starts') {
      newZones = newZones.map(z => ['food_court', 'restrooms'].includes(z.id) ? { ...z, currentCrowd: Math.min(z.maxCapacity, z.currentCrowd + 80) } : z);
      addEvt('Rain Started', 'Visitors moving to covered areas. Indoor zones filling.', 'warning', 'crowd');
      addMsg('crowd', 'orchestrator', 'Rain alert: visitors seeking shelter. Indoor zones surging.', 'warning');
    }
    else if (scenario === 'vip_arrival') {
      newZones = newZones.map(z => z.id === 'vip' ? { ...z, currentCrowd: Math.min(z.maxCapacity, z.currentCrowd + 30) } : z);
      addEvt('VIP Arrival', 'VIP entourage arrived. Fast-track lane activated.', 'action', 'ticket');
      addMsg('ticket', 'orchestrator', 'VIP arrival confirmed. Fast-track lane cleared.', 'action');
    }
    else if (scenario === 'concert_starts') {
      newZones = newZones.map(z => z.id === 'main_stage' ? { ...z, currentCrowd: Math.min(z.maxCapacity, z.currentCrowd + 800) } : z);
      addEvt('Concert Started', 'Main act started. Crowd surging toward Main Stage.', 'warning', 'crowd');
      addMsg('crowd', 'orchestrator', 'Concert start: Main Stage crowd surging.', 'warning');
      addMsg('orchestrator', 'emergency', 'Stage surge detected. Deploy crowd safety team.', 'action');
    }
    else if (scenario === 'emergency') {
      newAlerts = [{ id: `a_${Date.now()}`, severity: 'critical', title: 'EMERGENCY: Medical Incident', message: 'Medical emergency reported near Main Stage. Emergency team dispatched.', zone: 'Main Stage', timestamp: now2, read: false, dismissed: false }, ...newAlerts];
      addEvt('EMERGENCY', 'Medical emergency near Main Stage.', 'critical', 'emergency');
      addMsg('emergency', 'orchestrator', 'CRITICAL: Medical emergency. Dispatching Team 1.', 'action');
      addMsg('orchestrator', 'crowd', 'Clear path to Main Stage for emergency team.', 'action');
      addMsg('orchestrator', 'parking', 'Reserve emergency lane at main entrance.', 'action');
    }
    else if (scenario === 'power_failure') {
      newAlerts = [{ id: `a_${Date.now()}`, severity: 'critical', title: 'Power Failure', message: 'Partial power failure in Food Court sector. Emergency lighting active.', zone: 'Food Court', timestamp: now2, read: false, dismissed: false }, ...newAlerts];
      addEvt('Power Failure', 'Partial power failure in Food Court. Emergency protocols active.', 'critical', 'emergency');
      addMsg('emergency', 'orchestrator', 'Power failure in sector 3. Emergency lighting deployed.', 'warning');
      addMsg('orchestrator', 'crowd', 'Initiate safe evacuation of Food Court sector.', 'action');
    }
    else if (scenario === 'event_ends') {
      newZones = newZones.map(z => ['exit_main', 'emergency_exit'].includes(z.id) ? { ...z, currentCrowd: z.currentCrowd + 400 } : z);
      addEvt('Event Ended', 'Main performance concluded. Crowd moving to exits.', 'warning', 'orchestrator');
      addMsg('orchestrator', 'gate', 'Event ended. Open all exit gates.', 'action');
      addMsg('orchestrator', 'parking', 'Prepare vehicle dispatch. Crowd exiting.', 'action');
      addMsg('crowd', 'orchestrator', 'Exit crowd prediction: 4,000 in next 20 min.', 'warning');
    }
    newZones = newZones.map(z => {
      const occ = Math.round((z.currentCrowd / z.maxCapacity) * 100);
      const risk: RiskLevel = occ >= 95 ? 'critical' : occ >= 80 ? 'high' : occ >= 60 ? 'medium' : 'low';
      return { ...z, occupancy: occ, riskLevel: risk };
    });
    set({ zones: newZones, alerts: newAlerts, timeline: newTimeline, agentMessages: newMsgs.slice(-50), activeScenario: scenario, kpi: computeKPI(newZones, newAlerts, recommendations) });
    setTimeout(() => set({ activeScenario: null }), 3000);
  },
}));
