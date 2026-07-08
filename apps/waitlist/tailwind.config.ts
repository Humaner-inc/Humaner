import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#fff8f2',
        foreground: '#070607',
        accent: {
          DEFAULT: '#dc143c',
          foreground: '#070607'
        },
        brand: {
          DEFAULT: '#6b2d3a',
          foreground: '#fff8f2'
        }
      },
      fontFamily: {
        sans: ['var(--font-fellix)', 'system-ui', 'sans-serif'],
        display: ['Humaner Display Fallback', 'var(--font-the-seasons)', 'Georgia', 'serif'],
        mono: ['var(--font-humaner-mono)', 'ui-monospace', 'monospace'],
        fellix: ['var(--font-fellix)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
