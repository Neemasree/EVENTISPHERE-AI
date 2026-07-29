/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand primaries
        cyan:    { DEFAULT: '#00d4ff', 400: '#22d3ee', 500: '#00d4ff' },
        // Neon accents
        'neon-cyan':    '#00d4ff',
        'neon-green':   '#00f5a0',
        'neon-purple':  '#a855f7',
        'neon-pink':    '#f0abfc',
        'neon-orange':  '#fb923c',
        'neon-red':     '#f43f5e',
        'neon-yellow':  '#fbbf24',
        // Surface system
        surface: {
          0:  '#020409',
          50: '#060c16',
          100:'#0a1628',
          200:'#0f1f3a',
          300:'#162540',
          400:'#1e3048',
          500:'#243650',
          600:'#2e4460',
          700:'#374f6e',
          800:'#4a6380',
        },
        // Legacy compat
        'dark-900': '#020409',
        'dark-800': '#0a1628',
        'dark-700': '#0f1f3a',
        'dark-600': '#2e4460',
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'aurora-1':          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,255,0.15) 0%, transparent 60%)',
        'aurora-2':          'radial-gradient(ellipse 60% 40% at 80% 110%, rgba(168,85,247,0.12) 0%, transparent 60%)',
        'aurora-3':          'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0,245,160,0.05) 0%, transparent 70%)',
        'grid-fine':         "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v32H0z' fill='none'/%3E%3Cpath d='M0 0v32M32 0v32M0 0h32M0 32h32' stroke='rgba(255,255,255,0.03)' stroke-width='0.5'/%3E%3C/svg%3E\")",
        'dots':              "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(255,255,255,0.04)'/%3E%3C/svg%3E\")",
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter':  '-0.02em',
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(0,212,255,0.35), 0 0 60px rgba(0,212,255,0.15)',
        'glow-green':   '0 0 20px rgba(0,245,160,0.35), 0 0 60px rgba(0,245,160,0.12)',
        'glow-purple':  '0 0 20px rgba(168,85,247,0.35), 0 0 60px rgba(168,85,247,0.12)',
        'glow-red':     '0 0 20px rgba(244,63,94,0.4),  0 0 60px rgba(244,63,94,0.15)',
        'glow-orange':  '0 0 20px rgba(251,146,60,0.35), 0 0 60px rgba(251,146,60,0.12)',
        'card':         '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.06) inset',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.1) inset',
        'inner-glow':   'inset 0 1px 0 rgba(255,255,255,0.08)',
        'panel':        '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-fast':   'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 8s linear infinite',
        'spin-reverse': 'spin-reverse 6s linear infinite',
        'glow-cyan':    'glowCyan 2.5s ease-in-out infinite alternate',
        'glow-red':     'glowRed 1.5s ease-in-out infinite alternate',
        'float':        'float 4s ease-in-out infinite',
        'float-delay':  'float 4s ease-in-out infinite 2s',
        'scan':         'scan 3s ease-in-out infinite',
        'slide-up':     'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-right':  'slideRight 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':      'fadeIn 0.4s ease-out',
        'shimmer':      'shimmer 2s linear infinite',
        'ping-slow':    'ping 2.5s cubic-bezier(0,0,0.2,1) infinite',
        'border-spin':  'borderSpin 4s linear infinite',
        'wave':         'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        glowCyan: {
          '0%':   { boxShadow: '0 0 10px rgba(0,212,255,0.3), 0 0 20px rgba(0,212,255,0.1)' },
          '100%': { boxShadow: '0 0 25px rgba(0,212,255,0.6), 0 0 50px rgba(0,212,255,0.25)' },
        },
        glowRed: {
          '0%':   { boxShadow: '0 0 10px rgba(244,63,94,0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(244,63,94,0.8), 0 0 50px rgba(244,63,94,0.3)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        scan: {
          '0%,100%': { opacity: '0.3', transform: 'translateY(-100%)' },
          '50%':     { opacity: '0.8', transform: 'translateY(100%)' },
        },
        slideUp: {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        slideRight: {
          from: { transform: 'translateX(-20px)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        borderSpin: {
          '0%':   { '--angle': '0deg' },
          '100%': { '--angle': '360deg' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to:   { transform: 'rotate(0deg)' },
        },
        wave: {
          '0%,100%': { transform: 'scaleY(0.5)' },
          '50%':     { transform: 'scaleY(1.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      transitionTimingFunction: {
        'spring':   'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-in':'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
