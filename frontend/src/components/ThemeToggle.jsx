import { Moon, Sun } from "lucide-react";
import { useTheme } from "../theme.js";
import IconButton from "./IconButton.jsx";

export default function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <IconButton
      icon={theme === "dark" ? Sun : Moon}
      label={`Switch to ${next} mode`}
      onClick={toggleTheme}
    />
  );
}
