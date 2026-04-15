/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black:    '#080808',
        'gray-950': '#0d0d0d',
        'gray-900': '#141414',
        'gray-850': '#1a1a1a',
        'gray-800': '#222222',
        'gray-700': '#2e2e2e',
        'gray-600': '#3d3d3d',
        'gray-500': '#555555',
        'gray-400': '#777777',
        'gray-300': '#999999',
        'gray-200': '#c4c4c4',
        'gray-100': '#e5e5e5',
        'gray-50':  '#f5f5f5',
        white:    '#ffffff',
        accent:   '#ffffff',   // white — primary highlight
        'accent-dim': '#999999',
        danger:   '#ef4444',
        success:  '#ffffff',
      },
      fontFamily: {
        sans:    ['Inter', 'DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(255,255,255,0.08)',
        glow:      '0 0 28px rgba(255,255,255,0.12)',
        'glow-lg': '0 0 50px rgba(255,255,255,0.10)',
        'card':    '0 4px 24px rgba(0,0,0,0.6)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'grid-dark': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='%23ffffff08' stroke-width='1'/%3E%3C/svg%3E")`,
        'noise': `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease forwards',
        'fade-up':      'fadeUp 0.5s ease forwards',
        'fade-up-slow': 'fadeUp 0.8s ease forwards',
        'scale-in':     'scaleIn 0.3s ease forwards',
        'slide-down':   'slideDown 0.25s ease forwards',
        'shimmer':      'shimmer 1.8s infinite',
        'pulse-slow':   'pulse 3s infinite',
        'spin-slow':    'spin 8s linear infinite',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:     { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
