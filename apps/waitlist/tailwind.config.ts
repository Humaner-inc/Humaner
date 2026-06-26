import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f5f5f5',
        foreground: '#070607',
        accent: {
          DEFAULT: '#dc143c',
          foreground: '#070607'
        },
        brand: {
          DEFAULT: '#6b2d3a',
          foreground: '#f5f5f5'
        }
      },
      fontFamily: {
        sans: ['var(--font-fellix)', 'system-ui', 'sans-serif'],
        display: ['Humaner Display Fallback', 'var(--font-the-seasons)', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
};

export default config;
