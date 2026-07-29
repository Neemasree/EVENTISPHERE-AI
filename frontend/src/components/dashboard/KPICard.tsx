import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import AnimatedCounter from '../common/AnimatedCounter';

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;        // hex
  bgColor?: string;     // hex with alpha — used for icon bg
  suffix?: string;
  prefix?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  animate?: boolean;
  delay?: number;
  critical?: boolean;
}

export default function KPICard({
  title, value, icon, color, suffix, prefix,
  subtitle, trend, trendValue, animate = true, delay = 0, critical = false,
}: Props) {
  const trendColor = trend === 'up' ? '#fb923c' : trend === 'down' ? '#00f5a0' : 'rgba(255,255,255,0.35)';
  const trendIcon  = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl group cursor-default"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: critical ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.08)',
        borderTopColor: critical ? `${color}60` : 'rgba(255,255,255,0.1)',
        boxShadow: critical
          ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}20, inset 0 1px 0 rgba(255,255,255,0.07)`
          : '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        animation: critical ? 'criticalPulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Icon glow blob */}
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-15 group-hover:opacity-25 transition-opacity duration-500 blur-2xl"
        style={{ background: color }}
      />

      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }} />

      <div className="relative z-10 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>

          {trend && trendValue && (
            <div className="flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: trendColor }}>
              <span>{trendIcon}</span>
              <span className="font-mono">{trendValue}</span>
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-1.5">{title}</p>

        {/* Value */}
        <div className="text-2xl font-bold leading-none mb-1.5 font-counter"
          style={{ color }}>
          {animate && typeof value === 'number'
            ? <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            : <span>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</span>
          }
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] text-white/35 truncate leading-tight">{subtitle}</p>
        )}
      </div>

      {/* Bottom progress bar (for numeric values) */}
      {typeof value === 'number' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, value)}%` }}
            transition={{ duration: 1, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
        </div>
      )}
    </motion.div>
  );
}
