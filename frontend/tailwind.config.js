/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface-2'),
        ink: token('ink'),
        ink2: token('ink-2'),
        ink3: token('ink-3'),
        line: token('line'),
        linestrong: token('line-strong'),
        coach: token('coach'),
        coach2: token('coach-2'),
        coachink: token('coach-ink'),
        accent: token('accent'),
        marigold: token('marigold'),
        marigoldink: token('marigold-ink'),
        danger: token('danger'),
        success: token('success'),
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
        xl: '16px',
      },
      boxShadow: {
        lift: '0 1px 2px rgb(var(--shadow) / 0.06), 0 8px 24px -8px rgb(var(--shadow) / 0.18)',
        float: '0 2px 6px rgb(var(--shadow) / 0.08), 0 24px 60px -18px rgb(var(--shadow) / 0.35)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        dash: { to: { strokeDashoffset: '-40' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        drift: { from: { transform: 'translateX(-40px)' }, to: { transform: 'translateX(60px)' } },
        idle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-1.6px)' } },
        twinkle: { '0%, 100%': { opacity: '0.25' }, '50%': { opacity: '1' } },
      },
      animation: {
        drift: 'drift 38s ease-in-out infinite alternate',
        idle: 'idle 0.42s ease-in-out infinite',
        twinkle: 'twinkle 3.2s ease-in-out infinite',
        dash: 'dash 1.2s linear infinite',
        shimmer: 'shimmer 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
