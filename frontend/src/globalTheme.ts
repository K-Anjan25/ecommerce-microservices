import { createTheme } from "@mui/material/styles";

/**
 * Cartly Bold Market — MUI theme, generated from design/tokens.json and kept in
 * lock-step with tailwind.config.js / src/tokens.css.
 */

type Mode = "light" | "dark";

const LIGHT = {
  brand: "#0052CC",
  brandHover: "#0747A6",
  action: "#0052CC",
  actionHover: "#0747A6",
  brandLight: "#3B82F6",
  brandDark: "#091E42",
  accent: "#FF5722",
  accentDark: "#E64A19",
  accentLight: "#FFAB91",
  paper: "#FFFFFF",
  canvas: "#F5F6F8",
  sunken: "#EBECF0",
  line: "#E2E8F0",
  ink: "#0F172A",
  inkSoft: "#475569",
  inkMuted: "#5F6368",
  inkFaint: "#CBD5E1",
  contrast: "#0F172A",
  success: "#0E9F6E",
  warning: "#F0A020",
  danger: "#E0334B",
  info: "#0052CC",
  shadow: "0 2px 8px rgba(15,23,42,0.06)",
  shadowPop: "0 20px 40px rgba(15,23,42,0.12)",
};

const DARK: typeof LIGHT = {
  brand: "#60A5FA",
  brandHover: "#93C5FD",
  action: "#0052CC",
  actionHover: "#1D4ED8",
  brandLight: "#BFDBFE",
  brandDark: "#1D4ED8",
  accent: "#FF7043",
  accentDark: "#FF5722",
  accentLight: "#FFAB91",
  paper: "#1E2430",
  canvas: "#111827",
  sunken: "#273142",
  line: "#374151",
  ink: "#F9FAFB",
  inkSoft: "#D1D5DB",
  inkMuted: "#9CA3AF",
  inkFaint: "#6B7280",
  contrast: "#1F2937",
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
  soft: "#EFF6FF",
  tint: "#F5F9FF",
};
export const accent = {
  main: LIGHT.accent,
  dark: LIGHT.accentDark,
  light: LIGHT.accentLight,
  soft: "#FBE9E7",
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
        main: c.action,
        light: c.brandLight,
        dark: c.actionHover,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: c.accent,
        light: c.accentLight,
        dark: c.accentDark,
        contrastText: "#FFFFFF",
      },
      background: { default: c.canvas, paper: c.paper },
      text: { primary: c.ink, secondary: c.inkSoft, disabled: c.inkMuted },
      divider: c.line,
      success: { main: c.success },
      error: { main: c.danger },
      warning: { main: c.warning },
      info: { main: c.info },
      action: {
        hover: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.04)",
        selected: mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,82,204,0.08)",
      },
    },
    typography: {
      fontFamily: "'Inter', system-ui, 'Helvetica Neue', Arial, sans-serif",
      h1: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.025em" },
      h3: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 700 },
      subtitle1: { fontWeight: 600 },
      button: { fontWeight: 700, textTransform: "none" },
      overline: { fontWeight: 700, letterSpacing: "0.14em" },
    },
    shape: { borderRadius: 12 },
    shadows: [
      "none",
      mode === "dark" ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 3px rgba(15,23,42,0.06)",
      c.shadow,
      mode === "dark" ? "0 8px 24px rgba(0,0,0,0.55)" : "0 8px 20px rgba(15,23,42,0.08)",
      mode === "dark" ? "0 12px 32px rgba(0,0,0,0.6)" : "0 12px 28px rgba(15,23,42,0.10)",
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
            borderRadius: 999,
            fontWeight: 700,
            textTransform: "none",
            paddingLeft: 20,
            paddingRight: 20,
          },
          containedPrimary: {
            boxShadow: "0 4px 14px rgba(0,82,204,0.3)",
            "&:hover": { backgroundColor: c.actionHover },
          },
          containedSecondary: {
            color: "#FFFFFF",
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
              borderRadius: 12,
              backgroundColor: c.paper,
              "& fieldset": { borderColor: c.line },
              "&:hover fieldset": { borderColor: c.brand },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: c.paper,
            color: c.ink,
            "& fieldset": { borderColor: c.line },
            "&:hover fieldset": { borderColor: c.brand },
            "&.Mui-focused fieldset": { borderColor: c.action },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: c.inkSoft,
            "&.Mui-focused": {
              color: c.action,
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: 4,
            fontSize: 11,
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: "small" },
        styleOverrides: {
          select: {
            borderRadius: 12,
            color: c.ink,
            "&:focus": {
              borderRadius: 12,
              backgroundColor: "transparent",
            },
          },
          icon: {
            color: c.inkSoft,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: 14,
            color: c.ink,
            paddingTop: 8,
            paddingBottom: 8,
            "&.Mui-selected": {
              backgroundColor: mode === "dark" ? "rgba(96,165,250,0.18)" : "rgba(0,82,204,0.08)",
              fontWeight: 600,
              color: c.brand,
              "&:hover": {
                backgroundColor: mode === "dark" ? "rgba(96,165,250,0.25)" : "rgba(0,82,204,0.12)",
              },
            },
            "&:hover": {
              backgroundColor: c.sunken,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 16, border: `1px solid ${c.line}`, boxShadow: c.shadow },
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
          paper: { borderRadius: 16, boxShadow: c.shadowPop, backgroundColor: c.paper },
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
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: c.inkMuted,
            backgroundColor: c.canvas,
            borderBottomColor: c.line,
          },
          root: { borderBottomColor: c.line },
        },
      },
      MuiTableContainer: { styleOverrides: { root: { borderRadius: 14 } } },
      MuiTablePagination: { styleOverrides: { root: { color: c.inkSoft } } },
      MuiAlert: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === "dark" ? "#374151" : "#0F172A",
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
