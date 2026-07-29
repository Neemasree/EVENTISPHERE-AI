import type { RiskLevel, AlertSeverity } from '../types';

export const riskColor = (risk: RiskLevel): string => {
  switch (risk) {
    case 'low': return '#00ff88';
    case 'medium': return '#fbbf24';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

export const riskBg = (risk: RiskLevel): string => {
  switch (risk) {
    case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

export const riskGlow = (risk: RiskLevel): string => {
  switch (risk) {
    case 'low': return 'shadow-[0_0_12px_rgba(0,255,136,0.4)]';
    case 'medium': return 'shadow-[0_0_12px_rgba(251,191,36,0.4)]';
    case 'high': return 'shadow-[0_0_12px_rgba(249,115,22,0.4)]';
    case 'critical': return 'shadow-[0_0_20px_rgba(239,68,68,0.6)]';
    default: return '';
  }
};

export const severityColor = (s: AlertSeverity): string => {
  switch (s) {
    case 'low': return '#00ff88';
    case 'medium': return '#fbbf24';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#6b7280';
  }
};

export const severityBg = (s: AlertSeverity): string => {
  switch (s) {
    case 'low': return 'bg-green-500/15 border-green-500/40 text-green-400';
    case 'medium': return 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400';
    case 'high': return 'bg-orange-500/15 border-orange-500/40 text-orange-400';
    case 'critical': return 'bg-red-500/15 border-red-500/40 text-red-400';
    default: return '';
  }
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const formatTimeAgo = (date: Date): string => {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export const occupancyColor = (pct: number): string => {
  if (pct >= 95) return '#ef4444';
  if (pct >= 80) return '#f97316';
  if (pct >= 60) return '#fbbf24';
  return '#00ff88';
};

export const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const speakAlert = (text: string, muted: boolean) => {
  if (muted || !window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.95;
  utter.pitch = 1;
  utter.volume = 0.8;
  window.speechSynthesis.speak(utter);
};
