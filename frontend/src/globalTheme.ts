import { createTheme } from "@mui/material/styles";

/**
 * Cartly 2.0 — MUI theme, generated from design/tokens.json and kept in
 * lock-step with tailwind.config.js / src/tokens.css.
 *
 * Tailwind resolves colours through CSS variables, so it flips for free when
 * `.dark` is set. MUI needs real values, so the palette is built per mode by
 * `createAppTheme(mode)`; `theme` remains exported for anything still importing
 * the light theme directly.
 */

type Mode = "light" | "dark";

const LIGHT = {
  brand: "#5B3DF5",
  brandHover: "#4A2ED6",
  brandLight: "#7C5CFF",
  brandDark: "#2A1980",
  accent: "#D8F14B",
  accentDark: "#A8BE22",
  accentLight: "#E4F77E",
  paper: "#FFFFFF",
  canvas: "#F6F5F2",
  sunken: "#EFEEE9",
  line: "#E5E3DD",
  ink: "#0B0B0F",
  inkSoft: "#5A5F6E",
  inkMuted: "#8A8F9E",
  inkFaint: "#C9CCD5",
  contrast: "#0B0B0F",
  success: "#0E9F6E",
  warning: "#F0A020",
  danger: "#E0334B",
  info: "#2F80ED",
  shadow: "0 2px 10px rgba(11,11,15,0.06)",
  shadowPop: "0 20px 48px rgba(11,11,15,0.14)",
};

const DARK: typeof LIGHT = {
  brand: "#7C5CFF",
  brandHover: "#9B84FF",
  brandLight: "#B9A8FF",
  brandDark: "#5B3DF5",
  accent: "#D8F14B",
  accentDark: "#A8BE22",
  accentLight: "#E4F77E",
  paper: "#14161C",
  canvas: "#0B0C10",
  sunken: "#1B1E26",
  line: "#2A2E39",
  ink: "#F2F3F6",
  inkSoft: "#A2A8B8",
  inkMuted: "#767D8E",
  inkFaint: "#4A4F5C",
  contrast: "#1E212A",
  success: "#34D399",
  warning: "#FBBF24",
  danger: "#FB7185",
  info: "#60A5FA",
  shadow: "0 2px 10px rgba(0,0,0,0.5)",
  shadowPop: "0 20px 48px rgba(0,0,0,0.65)",
};

/* Back-compat named exports (light values) used by a few modules. */
export const brand = {
  deep: LIGHT.brandDark,
  dark: LIGHT.brandDark,
  main: LIGHT.brand,
  hover: LIGHT.brandHover,
  light: LIGHT.brandLight,
  soft: "#EDE9FE",
  tint: "#F5F3FF",
};
export const accent = {
  main: LIGHT.accent,
  dark: LIGHT.accentDark,
  light: LIGHT.accentLight,
  soft: "#F2FBC9",
};
export const ink = {
  primary: LIGHT.ink,
  secondary: LIGHT.inkSoft,
  muted: LIGHT.inkMuted,
  faint: LIGHT.inkFaint,
};
export const surfaces = {
  canvas: LIGHT.canvas,
  paper: LIGHT.paper,
  sunken: LIGHT.sunken,
  line: LIGHT.line,
  inverse: LIGHT.contrast,
};

export function createAppTheme(mode: Mode = "light") {
  const c = mode === "dark" ? DARK : LIGHT;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: c.brand,
        light: c.brandLight,
        dark: c.brandHover,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: c.accent,
        light: c.accentLight,
        dark: c.accentDark,
        contrastText: "#0B0B0F",
      },
      background: { default: c.canvas, paper: c.paper },
      text: { primary: c.ink, secondary: c.inkSoft, disabled: c.inkMuted },
      divider: c.line,
      success: { main: c.success },
      error: { main: c.danger },
      warning: { main: c.warning },
      info: { main: c.info },
      action: {
        hover: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(11,11,15,0.035)",
        selected: mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(11,11,15,0.06)",
      },
    },
    typography: {
      fontFamily: "'Inter', system-ui, 'Helvetica Neue', Arial, sans-serif",
      h1: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.03em" },
      h2: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.03em" },
      h3: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
      overline: { fontWeight: 700, letterSpacing: "0.16em" },
    },
    shape: { borderRadius: 14 },
    shadows: [
      "none",
      mode === "dark" ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(11,11,15,0.05)",
      c.shadow,
      mode === "dark" ? "0 8px 24px rgba(0,0,0,0.55)" : "0 8px 24px rgba(11,11,15,0.08)",
      mode === "dark" ? "0 12px 32px rgba(0,0,0,0.6)" : "0 12px 32px rgba(11,11,15,0.10)",
      c.shadowPop,
      ...Array(19).fill(c.shadow),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: { body: { backgroundColor: c.canvas } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600,
            textTransform: "none",
            paddingLeft: 18,
            paddingRight: 18,
          },
          containedPrimary: {
            boxShadow:
              mode === "dark"
                ? "0 6px 16px rgba(124,92,255,0.28)"
                : "0 6px 16px rgba(91,61,245,0.24)",
            "&:hover": { backgroundColor: c.brandHover },
          },
          containedSecondary: {
            color: "#0B0B0F",
            "&:hover": { backgroundColor: c.accentDark },
          },
          outlinedPrimary: {
            borderColor: c.line,
            color: c.ink,
            "&:hover": { borderColor: c.brand, backgroundColor: c.sunken, color: c.brand },
          },
          text: { "&:hover": { backgroundColor: c.sunken } },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small" },
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 10,
              backgroundColor: c.paper,
              "& fieldset": { borderColor: c.line },
              "&:hover fieldset": { borderColor: c.inkFaint },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 16, border: `1px solid ${c.line}`, boxShadow: "none" },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
          outlined: { borderColor: c.line },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, boxShadow: c.shadowPop, backgroundColor: c.paper },
        },
      },
      MuiAppBar: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none" } } },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 999 },
          outlined: { borderColor: c.line },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: c.inkMuted,
            backgroundColor: c.canvas,
            borderBottomColor: c.line,
          },
          root: { borderBottomColor: c.line },
        },
      },
      MuiTableContainer: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiTablePagination: { styleOverrides: { root: { color: c.inkSoft } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "dark" ? "#2A2E39" : "#0B0B0F",
            fontSize: 11,
            borderRadius: 8,
            padding: "6px 10px",
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 999, backgroundColor: c.sunken } },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : undefined },
        },
      },
      MuiMenu: {
        styleOverrides: { paper: { backgroundColor: c.paper, border: `1px solid ${c.line}` } },
      },
      MuiDrawer: { styleOverrides: { paper: { backgroundColor: c.paper } } },
    },
  });
}

export const theme = createAppTheme("light");
