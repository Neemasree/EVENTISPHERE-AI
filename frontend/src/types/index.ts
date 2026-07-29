// ─── Zone Types ──────────────────────────────────────────────────────────────
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ZoneType = 'parking' | 'gate' | 'vip' | 'stage' | 'food' | 'medical' | 'restroom' | 'exit' | 'emergency_exit';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  currentCrowd: number;
  maxCapacity: number;
  occupancy: number;
  waitingTime: number; // minutes
  riskLevel: RiskLevel;
  recommendation?: string;
  x: number; // SVG position
  y: number;
  width: number;
  height: number;
}

// ─── Alert Types ──────────────────────────────────────────────────────────────
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  zone?: string;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  actionTaken?: string;
}

// ─── Recommendation Types ─────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  zone: string;
  expectedReduction: number; // percentage
  estimatedTime: number; // minutes
  confidence: number; // percentage
  applied: boolean;
  timestamp: Date;
}

// ─── Prediction Types ─────────────────────────────────────────────────────────
export interface Prediction {
  zoneId: string;
  zoneName: string;
  current: number;
  in5min: number;
  in10min: number;
  in30min: number;
  predictedRisk: RiskLevel;
  confidence: number;
  capacity: number;
}

// ─── Agent Types ──────────────────────────────────────────────────────────────
export type AgentType = 'orchestrator' | 'crowd' | 'parking' | 'gate' | 'ticket' | 'emergency' | 'analytics';
export type AgentStatus = 'active' | 'idle' | 'processing' | 'alert';

export interface Agent {
  id: AgentType;
  name: string;
  status: AgentStatus;
  lastAction: string;
  messagesProcessed: number;
  icon: string;
}

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'action' | 'response';
  animated?: boolean;
}

// ─── Timeline Types ───────────────────────────────────────────────────────────
export interface TimelineEvent {
  id: string;
  time: Date;
  title: string;
  description: string;
  type: 'normal' | 'warning' | 'action' | 'resolved' | 'critical';
  agent?: AgentType;
}

// ─── KPI Types ────────────────────────────────────────────────────────────────
export interface KPIData {
  currentCrowd: number;
  totalCapacity: number;
  occupancyPercent: number;
  activeAlerts: number;
  aiRecommendations: number;
  avgWaitTime: number;
  peakZone: string;
  riskLevel: RiskLevel;
  agentStatus: AgentStatus;
  flowRate: number; // people per minute
}

// ─── Crowd Person (Animation) ─────────────────────────────────────────────────
export interface CrowdPerson {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: 'walking' | 'queuing' | 'entering' | 'leaving' | 'evacuating';
  zoneId: string;
}

// ─── Simulation Scenario ──────────────────────────────────────────────────────
export type ScenarioType =
  | 'bus_arrives'
  | 'rain_starts'
  | 'vip_arrival'
  | 'concert_starts'
  | 'emergency'
  | 'power_failure'
  | 'event_ends'
  | 'add_50'
  | 'add_100'
  | 'add_500';

export interface SimulationScenario {
  id: ScenarioType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  pinned: boolean;
  priority: number;
}

// ─── Incident ─────────────────────────────────────────────────────────────────
export interface Incident {
  id: string;
  severity: AlertSeverity;
  zone: string;
  time: Date;
  description: string;
  actionTaken: string;
  resolved: boolean;
  responseTime: number; // minutes
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface HourlyData {
  hour: string;
  visitors: number;
  capacity: number;
  incidents: number;
}

export interface ZoneAnalytics {
  zone: string;
  avgOccupancy: number;
  peakCrowd: number;
  incidents: number;
  avgWait: number;
}

// ─── Event Replay ─────────────────────────────────────────────────────────────
export interface ReplayFrame {
  timestamp: Date;
  label: string;
  zones: Record<string, { crowd: number; risk: RiskLevel }>;
  alerts: Alert[];
  kpi: Partial<KPIData>;
}

// ─── Chat Message ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
