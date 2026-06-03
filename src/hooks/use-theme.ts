import { useEffect, useState, useCallback } from "react";

const KEY = "vmp_theme";
type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (window.localStorage.getItem(KEY) as Theme | null) ?? "light";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const setTheme = useCallback((t: Theme) => {
    window.localStorage.setItem(KEY, t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setThemeState(t);
  }, []);

  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
