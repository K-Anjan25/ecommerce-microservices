import { useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./globalTheme";
import { QueryClient, QueryClientProvider } from "react-query";
import { Toasts } from "./components/Toasts";
// @ts-ignore: allow importing toastify CSS without type declarations
import "react-toastify/dist/ReactToastify.css";
import { PersistGate } from "redux-persist/integration/react";
import Loader from "./components/Loader";
import configureStore from "./config/configureStore";
import { ColorSchemeContext } from "./context/colorScheme";
import useColorScheme, { applyScheme, resolveInitialScheme } from "./hooks/useColorScheme";
import { I18nProvider } from "./features/i18n";
import "./style.css";

/* Paint the right scheme before React mounts, so there is no light flash. */
applyScheme(resolveInitialScheme());

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

const { store, persistor }: any = configureStore;

function Root() {
  const { scheme, toggle, isDark } = useColorScheme();
  const muiTheme = useMemo(() => createAppTheme(scheme), [scheme]);
  const ctx = useMemo(() => ({ scheme, toggle, isDark }), [scheme, toggle, isDark]);

  return (
    <I18nProvider>
    <ColorSchemeContext.Provider value={ctx}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Toasts />
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <App />
            </PersistGate>
          </Provider>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorSchemeContext.Provider>
    </I18nProvider>
  );
}

root.render(<Root />);

reportWebVitals();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; startup must never fail.
    });
  });
}
