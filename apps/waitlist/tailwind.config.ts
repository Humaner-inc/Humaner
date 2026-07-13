import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/shared/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#fff8f2",
        foreground: "#070607",
        accent: {
          DEFAULT: "#e1ccaf",
          foreground: "#060707",
        },
        fracture: {
          DEFAULT: "#e1ccaf",
          foreground: "#060707",
        },
        alternative: {
          DEFAULT: "#6b2d3a",
          foreground: "#fff8f2",
        },
        brand: {
          DEFAULT: "#6b2d3a",
          foreground: "#fff8f2",
        },
      },
      fontFamily: {
        sans: ["var(--font-fellix)", "system-ui", "sans-serif"],
        display: [
          "Humaner Display Fallback",
          "var(--font-the-seasons)",
          "Georgia",
          "serif",
        ],
        mono: ["var(--font-humaner-mono)", "ui-monospace", "monospace"],
        fellix: ["var(--font-fellix)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0",
        md: "0",
        sm: "0",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};

export default config;
