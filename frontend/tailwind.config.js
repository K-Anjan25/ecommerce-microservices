/** @type {import('tailwindcss').Config} */
/**
 * Cartly 2.0 — generated from design/tokens.json.
 * Token NAMES are unchanged from 1.x on purpose: every existing page picks up
 * the new look without being rewritten. Only the values moved.
 */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5B3DF5", // brand/600 — primary action
          dark: "#2A1980", // brand/900
          main: "#4A2ED6", // brand/700 — hover
          light: "#7C5CFF", // brand/500
          soft: "#EDE9FE", // brand/100
          tint: "#F5F3FF", // brand/50
        },
        accent: {
          DEFAULT: "#D8F14B", // accent/500 — lime highlight
          dark: "#A8BE22",
          light: "#E4F77E",
          soft: "#F2FBC9",
        },
        paper: "#FFFFFF",
        canvas: "#F6F5F2", // bone app background
        sunken: "#EFEEE9",
        line: "#E5E3DD",
        ink: {
          DEFAULT: "#0B0B0F",
          800: "#16171D",
          700: "#272932",
          soft: "#5A5F6E",
          muted: "#8A8F9E",
          faint: "#C9CCD5",
        },
        state: {
          success: "#0E9F6E",
          warning: "#F0A020",
          danger: "#E0334B",
          info: "#2F80ED",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Instrument Serif'", "Georgia", "serif"],
        heading: ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        eyebrow: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.16em" }],
      },
      borderRadius: {
        xs: "0.375rem",
        sm: "0.625rem",
        md: "0.875rem",
        lg: "1.25rem",
        xl2: "1.75rem",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(11,11,15,0.05)",
        card: "0 2px 10px rgba(11,11,15,0.06)",
        lift: "0 8px 24px rgba(11,11,15,0.08)",
        pop: "0 20px 48px rgba(11,11,15,0.14)",
        brand: "0 10px 24px rgba(91,61,245,0.28)",
      },
      maxWidth: {
        container: "80rem",
      },
      spacing: {
        header: "4.25rem",
        bottomnav: "3.875rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "none" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.21,1.02,0.73,1) both",
        "slide-down": "slide-down 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
