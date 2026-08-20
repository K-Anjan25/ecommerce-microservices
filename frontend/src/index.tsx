import CssBaseline from "@mui/material/CssBaseline";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./globalTheme";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";
// @ts-ignore: allow importing toastify CSS without type declarations
import "react-toastify/dist/ReactToastify.css";
import { PersistGate } from "redux-persist/integration/react";
import Loader from "./components/Loader";
import configureStore from "./config/configureStore";
import "./style.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const { store, persistor }: any = configureStore;

root.render(
  <>
    <CssBaseline />
    <ToastContainer />
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <PersistGate loading={<Loader />} persistor={persistor}>
            <App />
          </PersistGate>
        </Provider>
      </QueryClientProvider>
    </ThemeProvider>
  </>
);

reportWebVitals();
