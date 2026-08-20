/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#014C3E",
          dark: "#00372D",
          main: "#0B6B55",
          light: "#0F766E",
          soft: "#E8F1EE",
          tint: "#F3F8F6",
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#D97706",
          light: "#FBBF24",
          soft: "#FEF3C7",
        },
        paper: "#FAF7ED",
        ink: {
          DEFAULT: "#102A43",
          soft: "#55606E",
          muted: "#8A94A6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(16,42,67,0.06)",
        lift: "0 8px 24px rgba(16,42,67,0.12)",
      },
    },
  },
  plugins: [],
};
