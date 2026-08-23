import { createTheme } from "@mui/material/styles";

/**
 * Cartly 2.0 — MUI theme generated from design/tokens.json.
 * Kept in lock-step with tailwind.config.js so MUI components and Tailwind
 * utilities render the same design language.
 */

export const brand = {
  deep: "#2A1980",
  dark: "#2A1980",
  main: "#5B3DF5",
  hover: "#4A2ED6",
  light: "#7C5CFF",
  soft: "#EDE9FE",
  tint: "#F5F3FF",
};

export const accent = {
  main: "#D8F14B",
  dark: "#A8BE22",
  light: "#E4F77E",
  soft: "#F2FBC9",
};

export const ink = {
  primary: "#0B0B0F",
  secondary: "#5A5F6E",
  muted: "#8A8F9E",
  faint: "#C9CCD5",
};

export const surfaces = {
  canvas: "#F6F5F2",
  paper: "#FFFFFF",
  sunken: "#EFEEE9",
  line: "#E5E3DD",
  inverse: "#0B0B0F",
};

const softShadow = "0 2px 10px rgba(11,11,15,0.06)";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.main,
      light: brand.light,
      dark: brand.hover,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: accent.main,
      light: accent.light,
      dark: accent.dark,
      contrastText: ink.primary,
    },
    background: {
      default: surfaces.canvas,
      paper: surfaces.paper,
    },
    text: {
      primary: ink.primary,
      secondary: ink.secondary,
    },
    divider: surfaces.line,
    success: { main: "#0E9F6E" },
    error: { main: "#E0334B" },
    warning: { main: "#F0A020" },
    info: { main: "#2F80ED" },
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
  shape: {
    borderRadius: 14,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(11,11,15,0.05)",
    softShadow,
    "0 8px 24px rgba(11,11,15,0.08)",
    "0 12px 32px rgba(11,11,15,0.10)",
    "0 20px 48px rgba(11,11,15,0.14)",
    ...Array(19).fill(softShadow),
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: surfaces.canvas,
        },
      },
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
          boxShadow: "0 6px 16px rgba(91,61,245,0.24)",
          "&:hover": { backgroundColor: brand.hover, boxShadow: "0 10px 24px rgba(91,61,245,0.28)" },
        },
        containedSecondary: {
          color: ink.primary,
          "&:hover": { backgroundColor: accent.dark },
        },
        outlinedPrimary: {
          borderColor: surfaces.line,
          color: ink.primary,
          "&:hover": { borderColor: brand.main, backgroundColor: brand.tint, color: brand.main },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: surfaces.paper,
            "& fieldset": { borderColor: surfaces.line },
            "&:hover fieldset": { borderColor: ink.faint },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${surfaces.line}`,
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: surfaces.line },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20, boxShadow: "0 20px 48px rgba(11,11,15,0.14)" },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: "none", backgroundImage: "none" } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
        outlined: { borderColor: surfaces.line },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: ink.muted,
          backgroundColor: surfaces.canvas,
          borderBottomColor: surfaces.line,
        },
        root: { borderBottomColor: surfaces.line },
      },
    },
    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: ink.primary, fontSize: 11, borderRadius: 8, padding: "6px 10px" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 999, backgroundColor: surfaces.sunken } },
    },
  },
});
