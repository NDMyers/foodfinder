import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#ffffff",
        background: "#fafafa",
        primary: {
          DEFAULT: "#0d9488",
          dark: "#0f766e",
          light: "#ccfbf1",
        },
        accent: {
          DEFAULT: "#f97316",
          dark: "#ea580c",
          light: "#fff7ed",
        },
        gold: {
          DEFAULT: "#d97706",
          light: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fef2f2",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#6b7280",
          faint: "#d1d5db",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tight: "-0.02em",
        tighter: "-0.04em",
      },
      boxShadow: {
        elevated: "0 20px 48px rgba(0, 0, 0, 0.08)",
        soft: "0 10px 24px rgba(0, 0, 0, 0.06)",
        card: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
      },
      screens: {
        md: "960px",
      },
    },
  },
  plugins: [],
};

export default config;
