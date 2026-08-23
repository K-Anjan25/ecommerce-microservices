/** @type {import('tailwindcss').Config} */
/**
 * Cartly 2.0 — generated from design/tokens.json.
 *
 * Colours resolve through CSS custom properties declared in `src/tokens.css`
 * (`:root` = light, `.dark` = dark), so adding dark mode required zero page
 * edits: every existing `bg-paper` / `text-ink-soft` flips automatically.
 * The `rgb(var(--x) / <alpha-value>)` form keeps opacity modifiers working
 * (`border-line/60`, `bg-paper/90`).
 *
 * Token NAMES are unchanged from 1.x on purpose. `ink` is a FOREGROUND token
 * and `contrast` is the intentionally-dark SURFACE token — see tokens.css.
 */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      colors: {
        action: { DEFAULT: v("--c-action"), hover: v("--c-action-hover") },
        brand: {
          DEFAULT: v("--c-brand"),
          dark: v("--c-brand-dark"),
          main: v("--c-brand-main"),
          light: v("--c-brand-light"),
          soft: v("--c-brand-soft"),
          tint: v("--c-brand-tint"),
        },
        accent: {
          DEFAULT: v("--c-accent"),
          dark: v("--c-accent-dark"),
          light: v("--c-accent-light"),
          soft: v("--c-accent-soft"),
        },
        paper: v("--c-paper"),
        canvas: v("--c-canvas"),
        sunken: v("--c-sunken"),
        line: v("--c-line"),
        ink: {
          DEFAULT: v("--c-ink"),
          800: v("--c-ink-800"),
          700: v("--c-ink-700"),
          soft: v("--c-ink-soft"),
          muted: v("--c-ink-muted"),
          faint: v("--c-ink-faint"),
        },
        contrast: {
          DEFAULT: v("--c-contrast"),
          lift: v("--c-contrast-lift"),
        },
        oncontrast: v("--c-oncontrast"),
        state: {
          success: v("--c-success"),
          "success-soft": v("--c-success-soft"),
          "success-on": v("--c-success-on"),
          warning: v("--c-warning"),
          "warning-soft": v("--c-warning-soft"),
          "warning-on": v("--c-warning-on"),
          danger: v("--c-danger"),
          "danger-soft": v("--c-danger-soft"),
          "danger-on": v("--c-danger-on"),
          info: v("--c-info"),
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
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        pop: "var(--shadow-pop)",
        brand: "0 10px 24px rgba(164,71,45,0.24)",
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
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.21,1.02,0.73,1) both",
        "slide-down": "slide-down 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
