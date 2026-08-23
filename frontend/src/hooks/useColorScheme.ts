import { useCallback, useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "cartly-color-scheme";

/** Read the persisted choice, falling back to the OS preference. */
export function resolveInitialScheme(): ColorScheme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Toggle the `.dark` class Tailwind keys off, plus the browser UI colour. */
export function applyScheme(scheme: ColorScheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", scheme === "dark");
  root.style.colorScheme = scheme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", scheme === "dark" ? "#0B0C10" : "#0B0B0F");
}

/**
 * Colour scheme state. Persists an explicit choice; until the user makes one,
 * it keeps following the OS.
 */
export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorScheme>(resolveInitialScheme);

  useEffect(() => {
    applyScheme(scheme);
  }, [scheme]);

  // Follow the OS only while the user hasn't picked a side.
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
      setScheme(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setScheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { scheme, toggle, isDark: scheme === "dark" };
}

export default useColorScheme;
