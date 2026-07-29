import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import AnimatedCounter from '../common/AnimatedCounter';
import clsx from 'clsx';

interface Props {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: string;       // tailwind text color
  bgColor: string;     // tailwind bg color
  glowColor: string;   // CSS box-shadow color
  suffix?: string;
  prefix?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  animate?: boolean;
  delay?: number;
}

export default function KPICard({ title, value, icon, color, bgColor, glowColor, suffix, prefix, subtitle, trend, trendValue, animate = true, delay = 0 }: Props) {
  const trendColors = { up: 'text-red-400', down: 'text-green-400', stable: 'text-white/40' };
  const trendIcons = { up: '↑', down: '↓', stable: '→' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-white/20 transition-all duration-300 group"
      style={{ boxShadow: `0 0 30px ${glowColor}` }}
    >
      {/* Background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${bgColor} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}
            style={{ boxShadow: `0 0 12px ${glowColor}` }}>
            <span className={color}>{icon}</span>
          </div>
          {trend && trendValue && (
            <span className={`text-xs font-semibold ${trendColors[trend]}`}>
              {trendIcons[trend]} {trendValue}
            </span>
          )}
        </div>

        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">{title}</p>

        <div className={`text-2xl font-bold ${color} leading-none mb-1`}>
          {animate && typeof value === 'number'
            ? <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
            : <span>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</span>
          }
        </div>

        {subtitle && <p className="text-xs text-white/40 mt-1 truncate">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
