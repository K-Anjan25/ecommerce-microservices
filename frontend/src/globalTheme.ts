import { createTheme } from "@mui/material/styles";

export const brand = {
  deep: "#014C3E",
  dark: "#00372D",
  main: "#0B6B55",
  light: "#0F766E",
  soft: "#E8F1EE",
  tint: "#F3F8F6",
};

export const accent = {
  main: "#F59E0B",
  dark: "#D97706",
  light: "#FBBF24",
  soft: "#FEF3C7",
};

export const ink = {
  primary: "#102A43",
  secondary: "#55606E",
  muted: "#8A94A6",
};

export const surfaces = {
  canvas: "#FAF7ED",
  paper: "#FFFFFF",
  line: "#E5E0D4",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.deep,
      light: brand.light,
      dark: brand.dark,
      contrastText: "#FAF7ED",
    },
    secondary: {
      main: accent.main,
      light: accent.light,
      dark: accent.dark,
      contrastText: "#102A43",
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
    success: {
      main: "#15803D",
    },
    error: {
      main: "#B91C1C",
    },
    warning: {
      main: accent.dark,
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 2px 8px rgba(16,42,67,0.08)",
    "0 6px 16px rgba(16,42,67,0.10)",
    "0 8px 24px rgba(16,42,67,0.12)",
    "0 12px 32px rgba(16,42,67,0.14)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
    "0 1px 2px rgba(16,42,67,0.06)",
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: surfaces.canvas,
          backgroundImage:
            "radial-gradient(1200px 600px at 85% -10%, rgba(11,107,85,0.08), transparent 60%), radial-gradient(900px 500px at -10% 10%, rgba(245,158,11,0.06), transparent 55%)",
          backgroundAttachment: "fixed",
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
          paddingLeft: 20,
          paddingRight: 20,
        },
        containedPrimary: {
          boxShadow: "0 2px 8px rgba(1,76,62,0.28)",
          "&:hover": { boxShadow: "0 4px 14px rgba(1,76,62,0.32)" },
        },
        containedSecondary: {
          boxShadow: "0 2px 8px rgba(245,158,11,0.28)",
        },
        outlinedPrimary: {
          borderColor: brand.main,
          color: brand.deep,
          "&:hover": {
            borderColor: brand.main,
            backgroundColor: brand.tint,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: "#FFFFFF",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${surfaces.line}`,
          boxShadow: "0 2px 8px rgba(16,42,67,0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0 16px 48px rgba(16,42,67,0.18)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: ink.primary },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});
