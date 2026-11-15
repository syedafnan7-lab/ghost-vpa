/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canary: {
          500: '#F59E0B',
          600: '#D97706',
        },
        crimson: {
          500: '#EF4444',
          600: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Console-tuned scale: an 11px floor so dense tables stay legible.
        micro:   ['11px', { lineHeight: '1.45' }],
        caption: ['12px', { lineHeight: '1.50' }],
        body:    ['13px', { lineHeight: '1.60' }],
      },
      borderRadius: {
        // Three steps only. No 2xl/3xl blur.
        panel: '12px',
        card:  '8px',
        chip:  '6px',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
      transitionTimingFunction: {
        'out-quint': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'standard':  'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        instant: '90ms',
        fast:    '150ms',
        normal:  '250ms',
        slow:    '350ms',
      },
      keyframes: {
        rise: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        sweep: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.45' },
        },
        emerge: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'chain-ribbon': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        rise:          'rise 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in':     'fade-in 150ms cubic-bezier(0.16, 1, 0.3, 1) both',
        sweep:         'sweep 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'live-pulse':  'live-pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        emerge:        'emerge 250ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'chain-ribbon':'chain-ribbon 350ms cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}