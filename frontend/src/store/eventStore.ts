import { create } from 'zustand';
import type {
  Zone, Alert, Recommendation, Prediction, Agent, AgentMessage,
  TimelineEvent, KPIData, Notification, Incident, ChatMessage, RiskLevel, ScenarioType, Event
} from '../types';

export type ScanOutcome = 'verified' | 'duplicate' | 'rejected';

export interface DemoQueueEntry {
  ticketId: string;
  gate: string;
  outcome: ScanOutcome;
}

export interface ScanFeedEntry {
  id: string;
  ticketId: string;
  gate: string;
  status: ScanOutcome;
  reason: string;
  timestamp: Date;
}

const KNOWN_DUPLICATES = new Set(['EVT-2024-09812']);
const KNOWN_INVALID = new Set(['EVT-2024-00001']);

export function verifyTicket(ticketId: string): { outcome: ScanOutcome; reason: string } {
  if (KNOWN_INVALID.has(ticketId)) return { outcome: 'rejected', reason: 'Ticket not found in system' };
  if (KNOWN_DUPLICATES.has(ticketId)) return { outcome: 'duplicate', reason: 'Already scanned — duplicate detected' };
  return { outcome: 'verified', reason: 'Valid ticket confirmed' };
}

const demoQueue: DemoQueueEntry[] = [
  { ticketId: 'EVT-2024-15420', gate: 'Gate A', outcome: 'verified'   },
  { ticketId: 'EVT-2024-15421', gate: 'Gate A', outcome: 'verified'   },
  { ticketId: 'EVT-2024-09812', gate: 'Gate B', outcome: 'duplicate'  },
  { ticketId: 'EVT-2024-15423', gate: 'Gate C', outcome: 'verified'   },
  { ticketId: 'EVT-2024-15424', gate: 'Gate A', outcome: 'verified'   },
  { ticketId: 'EVT-2024-15426', gate: 'Gate C', outcome: 'verified'   },
  { ticketId: 'EVT-2024-00001', gate: 'Gate B', outcome: 'rejected'   },
  { ticketId: 'EVT-2024-15428', gate: 'Gate C', outcome: 'verified'   },
  { ticketId: 'EVT-2024-15429', gate: 'Gate A', outcome: 'verified'   },
  { ticketId: 'EVT-2024-09813', gate: 'Gate B', outcome: 'duplicate'  },
];

const initialZones: Zone[] = [
  { id: 'parking_a',     name: 'Parking A',      type: 'parking',       currentCrowd: 420,  maxCapacity: 500,  occupancy: 84, waitingTime: 5,  riskLevel: 'high',     x: 20,  y: 20,  width: 130, height: 60 },
  { id: 'parking_b',    name: 'Parking B',      type: 'parking',       currentCrowd: 180,  maxCapacity: 500,  occupancy: 36, waitingTime: 1,  riskLevel: 'low',      x: 170, y: 20,  width: 130, height: 60 },
  { id: 'vip',          name: 'VIP Lounge',     type: 'vip',           currentCrowd: 45,   maxCapacity: 150,  occupancy: 30, waitingTime: 0,  riskLevel: 'low',      x: 320, y: 20,  width: 110, height: 60 },
  { id: 'emergency_exit', name: 'Emergency Exit', type: 'emergency_exit', currentCrowd: 0,  maxCapacity: 1000, occupancy: 0,  waitingTime: 0,  riskLevel: 'low',      x: 450, y: 20,  width: 70,  height: 60 },
  { id: 'gate_a',       name: 'Gate A',         type: 'gate',          currentCrowd: 380,  maxCapacity: 500,  occupancy: 76, waitingTime: 8,  riskLevel: 'high',     x: 20,  y: 100, width: 90,  height: 55 },
  { id: 'gate_b',       name: 'Gate B',         type: 'gate',          currentCrowd: 120,  maxCapacity: 500,  occupancy: 24, waitingTime: 2,  riskLevel: 'low',      x: 125, y: 100, width: 90,  height: 55 },
  { id: 'gate_c',       name: 'Gate C',         type: 'gate',          currentCrowd: 90,   maxCapacity: 500,  occupancy: 18, waitingTime: 1,  riskLevel: 'low',      x: 230, y: 100, width: 90,  height: 55 },
  { id: 'food_court',   name: 'Food Court',     type: 'food',          currentCrowd: 520,  maxCapacity: 600,  occupancy: 87, waitingTime: 12, riskLevel: 'critical', x: 340, y: 100, width: 180, height: 55 },
  { id: 'main_stage',   name: 'Main Stage',     type: 'stage',         currentCrowd: 3200, maxCapacity: 5000, occupancy: 64, waitingTime: 0,  riskLevel: 'medium',   x: 20,  y: 175, width: 300, height: 120 },
  { id: 'medical',      name: 'Medical Bay',    type: 'medical',       currentCrowd: 8,    maxCapacity: 50,   occupancy: 16, waitingTime: 3,  riskLevel: 'low',      x: 340, y: 175, width: 90,  height: 55 },
  { id: 'restrooms',    name: 'Restrooms',      type: 'restroom',      currentCrowd: 95,   maxCapacity: 120,  occupancy: 79, waitingTime: 6,  riskLevel: 'high',     x: 450, y: 175, width: 70,  height: 55 },
  { id: 'exit_main',    name: 'Main Exit',      type: 'exit',          currentCrowd: 140,  maxCapacity: 400,  occupancy: 35, waitingTime: 2,  riskLevel: 'low',      x: 340, y: 250, width: 180, height: 50 },
];

const initialEvents: Event[] = [
  { id: 'ev1', name: 'Summer Music Festival', location: 'Central Arena, Mumbai', date: '2025-07-15', status: 'live', totalCapacity: 15000, zones: initialZones },
  { id: 'ev2', name: 'Tech Conference 2025', location: 'Convention Centre, Bangalore', date: '2025-08-20', status: 'upcoming', totalCapacity: 5000, zones: [] },
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
  events: Event[];
  activeEventId: string;
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
  kpi: KPIData;
  selectedZone: Zone | null;
  isMuted: boolean;
  isDarkMode: boolean;
  sidebarOpen: boolean;
  activeScenario: ScenarioType | null;
  ticketDemoQueue: DemoQueueEntry[];
  ticketDemoIndex: number;
  ticketScanFeed: ScanFeedEntry[];

  setSelectedZone: (zone: Zone | null) => void;
  applyRecommendation: (id: string) => void;
  dismissAlert: (id: string) => void;
  readAlert: (id: string) => void;
  addAgentMessage: (msg: AgentMessage) => void;
  addTimelineEvent: (evt: TimelineEvent) => void;
  addAlert: (alert: Alert) => void;
  addNotification: (n: Notification) => void;
  addEvent: (e: Event) => void;
  setActiveEvent: (id: string) => void;
  setZones: (zones: Zone[]) => void;
  triggerScenario: (scenario: ScenarioType) => void;
  addChatMessage: (msg: ChatMessage) => void;
  toggleMute: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  tickLiveData: () => void;
  simulateNextScan: () => void;
  refreshRecommendations: () => void;
}

function generateRecommendations(zones: Zone[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const now2 = new Date();
  zones.forEach(z => {
    if (z.occupancy >= 85 && z.type === 'food') {
      recs.push({ id: `rec_${z.id}`, title: `Expand ${z.name} Capacity`, description: `${z.name} at ${z.occupancy}% — overflow imminent in ~${Math.max(1, Math.round((z.maxCapacity - z.currentCrowd) / 15))} min.`, action: `Open additional stalls at ${z.name}`, zone: z.name, expectedReduction: Math.round(20 + (z.occupancy - 85) * 0.8), estimatedTime: 3, confidence: Math.min(99, 80 + z.occupancy - 85), applied: false, timestamp: now2 });
    }
    if (z.occupancy >= 80 && z.type === 'gate') {
      const altGates = zones.filter(g => g.type === 'gate' && g.id !== z.id && g.occupancy < 50);
      if (altGates.length) {
        const alt = altGates.sort((a, b) => a.occupancy - b.occupancy)[0];
        recs.push({ id: `rec_${z.id}`, title: `Redirect from ${z.name}`, description: `${z.name} at ${z.occupancy}%. ${alt.name} has capacity (${alt.occupancy}% load).`, action: `Display signage redirecting crowd from ${z.name} to ${alt.name}`, zone: z.name, expectedReduction: Math.round(25 + (z.occupancy - 80) * 0.7), estimatedTime: 2, confidence: Math.min(99, 82 + z.occupancy - 80), applied: false, timestamp: now2 });
      }
    }
    if (z.occupancy >= 80 && z.type === 'parking') {
      const altParking = zones.filter(p => p.type === 'parking' && p.id !== z.id && p.occupancy < 60);
      if (altParking.length) {
        const alt = altParking.sort((a, b) => a.occupancy - b.occupancy)[0];
        recs.push({ id: `rec_${z.id}`, title: `Reroute to ${alt.name}`, description: `${z.name} at ${z.occupancy}%. Route incoming vehicles to ${alt.name} (${alt.occupancy}% full).`, action: `Update signage: "${z.name} FULL — Use ${alt.name}"`, zone: z.name, expectedReduction: 35, estimatedTime: 2, confidence: 94, applied: false, timestamp: now2 });
      }
    }
    if (z.occupancy >= 75 && z.type === 'restroom') {
      recs.push({ id: `rec_${z.id}`, title: `${z.name} Queue Alert`, description: `${z.name} at ${z.occupancy}% — wait time ${z.waitingTime} min. Deploy mobile units.`, action: `Deploy 2 portable restroom units near ${z.name}`, zone: z.name, expectedReduction: 20, estimatedTime: 5, confidence: 78, applied: false, timestamp: now2 });
    }
    if (z.occupancy >= 90 && z.type === 'stage') {
      recs.push({ id: `rec_${z.id}`, title: `${z.name} Crowd Critical`, description: `${z.name} at ${z.occupancy}% — deploy crowd safety team immediately.`, action: `Activate crowd safety protocol at ${z.name}`, zone: z.name, expectedReduction: 15, estimatedTime: 1, confidence: 97, applied: false, timestamp: now2 });
    }
  });
  return recs.slice(0, 5);
}

const computeKPI = (zones: Zone[], alerts: Alert[], recs: Recommendation[]): KPIData => {
  if (!zones.length) return {
    currentCrowd: 0, totalCapacity: 0, occupancyPercent: 0,
    activeAlerts: alerts.filter(a => !a.dismissed).length,
    aiRecommendations: recs.filter(r => !r.applied).length,
    avgWaitTime: 0, peakZone: '—', riskLevel: 'low', agentStatus: 'active', flowRate: 0,
  };
  const totalCrowd = zones.reduce((s, z) => s + z.currentCrowd, 0);
  const totalCap   = zones.reduce((s, z) => s + z.maxCapacity, 0);
  const occupancy  = totalCap > 0 ? Math.round((totalCrowd / totalCap) * 100) : 0;
  const activeAlerts = alerts.filter(a => !a.dismissed).length;
  const avgWait    = Math.round(zones.reduce((s, z) => s + z.waitingTime, 0) / zones.length);
  const peakZone   = zones.reduce((a, b) => a.occupancy > b.occupancy ? a : b).name;
  const criticalCount = zones.filter(z => z.riskLevel === 'critical').length;
  const highCount     = zones.filter(z => z.riskLevel === 'high').length;
  const riskLevel: RiskLevel = criticalCount > 0 ? 'critical' : highCount > 1 ? 'high' : highCount > 0 ? 'medium' : 'low';
  return {
    currentCrowd: totalCrowd, totalCapacity: totalCap, occupancyPercent: occupancy,
    activeAlerts, aiRecommendations: recs.filter(r => !r.applied).length,
    avgWaitTime: avgWait, peakZone, riskLevel, agentStatus: 'active', flowRate: 240,
  };
};

export const useEventStore = create<EventState>((set, get) => ({
  events: initialEvents,
  activeEventId: 'ev1',
  zones: initialZones,
  alerts: initialAlerts,
  recommendations: initialRecommendations,
  predictions: initialPredictions,
  agents: initialAgents,
  agentMessages: [
    { id: 'seed_0', from: 'crowd',        to: 'orchestrator', message: 'Gate A at 76%. Queue building — requesting gate redistribution.', type: 'warning',  timestamp: ts(15), animated: false },
    { id: 'seed_1', from: 'orchestrator', to: 'gate',         message: 'Acknowledged. Open Gate C to absorb Gate A load.',               type: 'action',   timestamp: ts(14), animated: false },
    { id: 'seed_2', from: 'gate',         to: 'orchestrator', message: 'Gate C opened. Signage updated. Monitoring redistribution.',      type: 'response', timestamp: ts(13), animated: false },
    { id: 'seed_3', from: 'crowd',        to: 'orchestrator', message: 'Food Court at 87%. Overflow predicted in 4 minutes.',             type: 'warning',  timestamp: ts(8),  animated: false },
    { id: 'seed_4', from: 'orchestrator', to: 'crowd',        message: 'Recommendation queued: Open Food Stall 3. Awaiting approval.',    type: 'action',   timestamp: ts(7),  animated: false },
    { id: 'seed_5', from: 'parking',      to: 'orchestrator', message: 'Parking A at 84%. Rerouting arrivals to Lot B.',                  type: 'info',     timestamp: ts(5),  animated: false },
    { id: 'seed_6', from: 'orchestrator', to: 'analytics',    message: 'Log all events for post-event analysis report.',                  type: 'action',   timestamp: ts(2),  animated: false },
  ],
  timeline: initialTimeline,
  notifications: [],
  incidents: [
    { id: 'i1', severity: 'medium', zone: 'Gate A', time: ts(60), description: 'Queue buildup at Gate A', actionTaken: 'Opened Gate C — crowd redistributed', resolved: true, responseTime: 3 },
    { id: 'i2', severity: 'low', zone: 'Parking A', time: ts(45), description: 'Parking A 70% full', actionTaken: 'Signage updated to route to Lot B', resolved: true, responseTime: 2 },
    { id: 'i3', severity: 'critical', zone: 'Food Court', time: ts(8), description: 'Food Court overflow imminent', actionTaken: 'Opening stall 3 — pending approval', resolved: false, responseTime: 0 },
  ],
  chatMessages: [
    { id: 'c0', role: 'assistant', content: "Hello! I'm your EventSphere AI assistant. Ask me anything about the current event — crowd status, predictions, or recommendations.", timestamp: ts(1) },
  ],
  kpi: computeKPI(initialZones, initialAlerts, initialRecommendations),
  selectedZone: null,
  isMuted: false,
  isDarkMode: true,
  sidebarOpen: true,
  activeScenario: null,
  ticketDemoQueue: demoQueue,
  ticketDemoIndex: 0,
  ticketScanFeed: [],

  setSelectedZone: (zone) => set({ selectedZone: zone }),
  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),
  toggleDarkMode: () => set(s => ({ isDarkMode: !s.isDarkMode })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  addEvent: (e) => set(s => ({ events: [...s.events, e] })),
  setActiveEvent: (id) => set(s => {
    const ev = s.events.find(e => e.id === id);
    if (!ev) return {};
    return { activeEventId: id, zones: ev.zones.length ? ev.zones : s.zones };
  }),
  setZones: (zones) => set(s => {
    const updatedEvents = s.events.map(e => e.id === s.activeEventId ? { ...e, zones } : e);
    const recs = generateRecommendations(zones);
    return { zones, events: updatedEvents, recommendations: recs, kpi: computeKPI(zones, s.alerts, recs) };
  }),

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
    const newAlerts: Alert[] = [];
    const now2 = new Date();
    const zones = s.zones.map(z => {
      const c = nudge(z.currentCrowd, z.maxCapacity);
      const occ = Math.round((c / z.maxCapacity) * 100);
      const risk: RiskLevel = occ >= 95 ? 'critical' : occ >= 80 ? 'high' : occ >= 60 ? 'medium' : 'low';
      // Fire capacity-breach alert + voice when zone first crosses 100%
      if (c >= z.maxCapacity && z.currentCrowd < z.maxCapacity) {
        newAlerts.push({
          id: `cap_${z.id}_${Date.now()}`,
          severity: 'critical',
          title: `${z.name} Over Capacity!`,
          message: `${z.name} has exceeded maximum capacity (${z.maxCapacity.toLocaleString()}). Immediate action required.`,
          zone: z.name,
          timestamp: now2,
          read: false,
          dismissed: false,
        });
      }
      return { ...z, currentCrowd: c, occupancy: occ, riskLevel: risk };
    });
    const alerts = newAlerts.length ? [...newAlerts, ...s.alerts] : s.alerts;
    const recs = generateRecommendations(zones);
    return { zones, alerts, recommendations: recs, kpi: computeKPI(zones, alerts, recs) };
  }),

  refreshRecommendations: () => set(s => {
    const recs = generateRecommendations(s.zones);
    return { recommendations: recs, kpi: computeKPI(s.zones, s.alerts, recs) };
  }),

  simulateNextScan: () => set(s => {
    const entry = s.ticketDemoQueue[s.ticketDemoIndex];
    if (!entry) return {};

    const { outcome, reason } = verifyTicket(entry.ticketId);
    const result: ScanFeedEntry = {
      id: `scan_${Date.now()}`,
      ticketId: entry.ticketId,
      gate: entry.gate,
      status: outcome,
      reason,
      timestamp: new Date(),
    };

    let nextAlerts = s.alerts;
    let nextTimeline = s.timeline;
    const now2 = new Date();

    if (outcome === 'duplicate' || outcome === 'rejected') {
      const severity: Alert['severity'] = outcome === 'duplicate' ? 'high' : 'critical';
      const alertTitle = outcome === 'duplicate' ? 'Duplicate Ticket Detected' : 'Invalid Ticket Rejected';
      nextAlerts = [{ id: `a_${Date.now()}`, severity, title: alertTitle, message: `Ticket ${entry.ticketId} at ${entry.gate}: ${reason}`, zone: entry.gate, timestamp: now2, read: false, dismissed: false }, ...s.alerts];
      nextTimeline = [...s.timeline, { id: `te_${Date.now()}`, time: now2, title: alertTitle, description: `Ticket ${entry.ticketId} at ${entry.gate}: ${reason}`, type: outcome === 'duplicate' ? 'warning' : 'critical', agent: 'ticket' }];
    }

    const nextIndex = (s.ticketDemoIndex + 1) % s.ticketDemoQueue.length;

    return {
      ticketScanFeed: [result, ...s.ticketScanFeed],
      ticketDemoIndex: nextIndex,
      alerts: nextAlerts,
      timeline: nextTimeline,
    };
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
    const freshRecs = generateRecommendations(newZones);
    set(s => ({ recommendations: freshRecs, kpi: computeKPI(newZones, newAlerts, freshRecs) }));
    setTimeout(() => set({ activeScenario: null }), 3000);
  },
}));
