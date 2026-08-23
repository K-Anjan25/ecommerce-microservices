import { createContext, useContext } from "react";
import type { ColorScheme } from "../hooks/useColorScheme";

export const ColorSchemeContext = createContext<{
  scheme: ColorScheme;
  isDark: boolean;
  toggle: () => void;
}>({
  scheme: "light",
  isDark: false,
  toggle: () => undefined,
});

export const useColorSchemeContext = () => useContext(ColorSchemeContext);
