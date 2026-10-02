// Light/dark mode. index.html applies the saved choice before the first paint;
// this hook reads it back and switches it.
import { useState } from "react";

const THEME_KEY = "kioku_theme";

const readTheme = () =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";

export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked (private mode etc.): the switch still works until reload
    }
    setTheme(next);
  }

  return [theme, toggleTheme];
}
