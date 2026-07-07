import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#070607',
        foreground: '#fff8f2',
        accent: {
          DEFAULT: '#dc143c',
          foreground: '#ffffff'
        },
        fracture: '#dc143c',
        brand: {
          DEFAULT: '#6b2d3a',
          foreground: '#fff8f2'
        },
        muted: {
          DEFAULT: 'rgb(255 255 255 / 0.08)',
          foreground: 'rgb(255 255 255 / 0.55)'
        },
        border: 'rgb(255 255 255 / 0.12)'
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
