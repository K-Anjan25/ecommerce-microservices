import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E88E5",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00BFA5",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f4f8ff",
      paper: "#ffffff",
    },
    text: {
      primary: "#102a43",
      secondary: "#334e68",
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          boxShadow: "none",
          textTransform: "none",
        },
        containedSecondary: {
          textTransform: "none",
        },
      },
    },
  },
});
