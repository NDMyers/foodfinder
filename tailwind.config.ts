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
        background: "#f0f2f5", // Slightly deeper background for glass to stand out
        primary: {
          DEFAULT: "#000000", // Stark, premium black
          dark: "#1a1a1a",
          light: "#333333",
        },
        accent: {
          DEFAULT: "#2563eb", // Deep blue
          dark: "#1d4ed8",
          light: "#dbeafe",
        },
        gold: {
          DEFAULT: "#d97706",
          light: "#fef3c7",
        },
        danger: {
          DEFAULT: "#ef4444",
          light: "#fef2f2",
        },
        success: {
          DEFAULT: "#10b981",
          light: "#ecfdf5",
          dark: "#047857",
        },
        ink: {
          DEFAULT: "#000000",
          soft: "#4b5563",
          faint: "#e5e7eb",
        },
        glass: {
          DEFAULT: "rgba(255, 255, 255, 0.75)",
          dark: "rgba(255, 255, 255, 0.4)",
          border: "rgba(255, 255, 255, 0.5)",
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
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
      },
      backdropBlur: {
        xs: "2px",
        xl: "20px",
      },
      screens: {
        md: "960px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
