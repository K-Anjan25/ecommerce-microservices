import { useMemo } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./globalTheme";
import { QueryClient, QueryClientProvider } from "react-query";
import { hydrate } from "react-query/hydration";
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

/**
 * Shared emotion cache. The key must match the SSR server cache ("mui") so
 * server-rendered critical CSS is recognised instead of duplicated, and
 * `prepend` keeps MUI styles ahead of the app stylesheet.
 */
const emotionCache = createCache({ key: "mui", prepend: true });

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

/* Optional SSR hand-off: when the page was server-rendered, the cache ships
 * in a non-executable JSON tag (CSP-safe). Hydrating before the first render
 * makes the markup match, so the browser paints instantly and refetches in
 * the background. Absent in plain SPA mode. */
const ssrStateElement = document.getElementById("__SSR_STATE__");
if (ssrStateElement?.textContent) {
  try {
    hydrate(queryClient, JSON.parse(ssrStateElement.textContent));
  } catch {
    // Corrupt state must never block the client render.
  }
}

const { store, persistor }: any = configureStore;

function Root() {
  const { scheme, toggle, isDark } = useColorScheme();
  const muiTheme = useMemo(() => createAppTheme(scheme), [scheme]);
  const ctx = useMemo(() => ({ scheme, toggle, isDark }), [scheme, toggle, isDark]);

  return (
    <I18nProvider>
    <ColorSchemeContext.Provider value={ctx}>
      <CacheProvider value={emotionCache}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Toasts />
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <PersistGate loading={<Loader />} persistor={persistor}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </PersistGate>
          </Provider>
        </QueryClientProvider>
      </ThemeProvider>
      </CacheProvider>
    </ColorSchemeContext.Provider>
    </I18nProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(<Root />);

reportWebVitals();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; startup must never fail.
    });
  });
}
