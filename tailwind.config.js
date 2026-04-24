/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ws-accent': '#af7037',
        'ws-accent-soft': '#c98a4c',
        'ws-accent-muted': '#8b572a',
        'ws-gold': '#d4a574',
        'ws-paper': '#f7f3eb',
        'ws-ink': '#a89888',
        'ws-mist': '#7d6f62',
        'ws-void': '#0a0806',
        'ws-deep': '#0f0c09',
        'ws-panel': '#1c1814',
        'ws-raised': '#251f1a',
        'ws-line': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 20px -6px rgba(175,112,55,0.35)',
        glow: '0 0 40px -10px rgba(175,112,55,0.25)',
      },
    },
  },
  plugins: [],
};
