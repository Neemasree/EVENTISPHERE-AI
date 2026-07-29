import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import clsx from 'clsx';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string;
  onClick?: () => void;
  delay?: number;
}

export default function GlassCard({ children, className, hover, glow, onClick, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      onClick={onClick}
      style={glow ? { boxShadow: glow } : undefined}
      className={clsx(
        'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl',
        hover && 'hover:bg-white/8 hover:border-white/20 transition-all duration-300 cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
