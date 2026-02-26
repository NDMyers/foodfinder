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
        background: "#ffffff",
        primary: {
          DEFAULT: "#000000",
          dark: "#000000",
          light: "#111111",
        },
        accent: {
          DEFAULT: "#ff0000", // Stark, uncompromising Swiss Red
          dark: "#cc0000",
          light: "#ffcccc",
        },
        gold: {
          DEFAULT: "#ffcc00", // Stark warning yellow
          light: "#fff5cc",
        },
        danger: {
          DEFAULT: "#ff0000",
          light: "#ffe6e6",
        },
        success: {
          DEFAULT: "#00cc00", // Strong green
          light: "#e6ffe6",
          dark: "#009900",
        },
        ink: {
          DEFAULT: "#000000", // Pitch black
          soft: "#666666",   // Harsh medium gray
          faint: "#e0e0e0",  // Light construction gray
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tight: "-0.03em",
        tighter: "-0.05em",
        tightest: "-0.08em",
      },
      boxShadow: {
        // Stark, hard silhouettes instead of soft elevations
        elevated: "4px 4px 0px 0px rgba(0,0,0,1)",
        soft: "2px 2px 0px 0px rgba(0,0,0,1)",
        card: "4px 4px 0px 0px rgba(0,0,0,1)",
        none: "0 0 0 0 rgba(0,0,0,0)",
      },
      screens: {
        md: "960px",
      },
      animation: {
        "fade-in": "fadeIn 0.15s linear forwards",
        "slide-up": "slideUp 0.2s cubic-bezier(0, 0, 0.2, 1) forwards",
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
