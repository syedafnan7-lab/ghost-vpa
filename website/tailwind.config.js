/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#04070C',
        panel: '#0A0F17',
        raised: '#121A26',
        ink: '#E8EEF7',
        ink2: '#9AA7B8',
        ink3: '#5C6B7E',
        line: 'rgba(148,163,184,0.14)',
        lineStrong: 'rgba(148,163,184,0.26)',
        'line-strong': 'rgba(148,163,184,0.26)',
        canary: '#F5A524',
        canarydeep: '#B45309',
        alarm: '#F04438',
        benign: '#2DD4A7',
        feeder: '#A78BFA',
        device: '#38BDF8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        micro: ['11px', { lineHeight: '1.45' }],
        caption: ['12px', { lineHeight: '1.5' }],
        body: ['15px', { lineHeight: '1.65' }],
      },
      transitionTimingFunction: {
        signal: 'cubic-bezier(0.23, 1, 0.32, 1)',
        drift: 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      transitionDuration: {
        instant: '120ms',
        fast: '180ms',
        normal: '280ms',
        slow: '420ms',
      },
    },
  },
  plugins: [],
};
