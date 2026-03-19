/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          500: '#4f6ef7',
          600: '#3a57e8',
          700: '#2d44cc',
          900: '#1a2a7a',
        },
        surface: '#0f1117',
        panel:   '#181c2a',
        line:    '#252a3d',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(79,110,247,0.35)',
      },
    },
  },
  plugins: [],
};
