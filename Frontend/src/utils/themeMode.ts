import type { ResolvedTheme, ThemeMode } from "../types/theme";

export const THEME_MODE_STORAGE_KEY = "theme-mode";

const isThemeMode = (value: string): value is ThemeMode => {
  return value === "light" || value === "dark" || value === "system";
};

export const getStoredThemeMode = (): ThemeMode => {
  const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (saved && isThemeMode(saved)) {
    return saved;
  }
  return "system";
};

export const getSystemTheme = (): ResolvedTheme => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

export const resolveTheme = (mode: ThemeMode): ResolvedTheme => {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
};

export const applyThemeMode = (mode: ThemeMode) => {
  const resolvedTheme = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;
  document.body.setAttribute("data-theme", resolvedTheme);
};

export const subscribeSystemTheme = (onChange: () => void) => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => onChange();
  mediaQuery.addEventListener("change", listener);

  return () => {
    mediaQuery.removeEventListener("change", listener);
  };
};
