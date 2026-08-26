/**
 * Optional SSR entry — rendered by `server/ssr-server.mjs`.
 *
 * Architecture:
 * - The app tree is reused untouched; only the router is swapped
 *   (StaticRouter here, BrowserRouter in the browser).
 * - A per-request react-query cache is prefetched for the public routes
 *   (home/collection grid, bestsellers, product detail) with a hard timeout,
 *   so a slow or down backend can never hang the response.
 * - Successful queries are dehydrated; the HTTP server ships them in a
 *   CSP-safe `application/json` tag that the client hydrates before render.
 * - Emotion critical CSS is extracted (same cache key "mui" as the client).
 * - Streaming render with a completion timeout: if lazy chunks never settle,
 *   the partial shell is still returned and the client completes the page.
 */
import React from "react";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import {
  DehydratedState,
  QueryClient,
  QueryClientProvider,
  dehydrate,
} from "react-query";
import { Provider } from "react-redux";
import { legacy_createStore as createStore } from "redux";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import rootReducer from "../store";
import App from "../App";
import { createAppTheme } from "../globalTheme";
import { I18nProvider } from "../features/i18n";
import { prefetchForPath } from "./prefetch";

const RENDER_TIMEOUT_MS = 4000;

function renderElementToString(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const stream = new PassThrough();
    stream.setEncoding("utf8");
    stream.on("data", (chunk: string) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => {
      clearTimeout(timer);
      resolve(chunks.join(""));
    });

    const timer = setTimeout(() => {
      // Never hang the response: abort and ship the shell rendered so far.
      console.warn("[ssr] render timeout; shipping partial shell");
      abort();
    }, RENDER_TIMEOUT_MS);

    const { pipe, abort } = renderToPipeableStream(element, {
      onShellError: (error) => {
        clearTimeout(timer);
        reject(error);
      },
      onError: (error) => {
        console.warn("[ssr] render error:", error);
      },
    });
    pipe(stream);
  });
}

export type SsrRenderResult = {
  html: string;
  css: string;
  emotionIds: string[];
  dehydratedState: DehydratedState;
};

export async function render(url: string): Promise<SsrRenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 10_000 },
    },
  });

  await prefetchForPath(url, queryClient);

  // No thunk middleware: the server never dispatches (all effects, including
  // the session bootstrap, are browser-only) and redux-thunk's CJS default
  // interop differs between the bundled and vite-dev paths.
  const store = createStore(rootReducer);
  const cache = createCache({ key: "mui" });
  const theme = createAppTheme("light");

  const rawHtml = await renderElementToString(
    <I18nProvider>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <Provider store={store}>
              <StaticRouter location={url}>
                <App />
              </StaticRouter>
            </Provider>
          </QueryClientProvider>
        </ThemeProvider>
      </CacheProvider>
    </I18nProvider>
  );

  const critical = createEmotionServer(cache).extractCritical(rawHtml);
  const dehydratedState = dehydrate(queryClient);
  queryClient.clear();

  return {
    html: critical.html,
    css: critical.css,
    emotionIds: critical.ids,
    dehydratedState,
  };
}
