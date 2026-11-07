import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "", label = false }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`inline-flex items-center gap-2 rounded p-1 text-sm text-slate-400 hover:text-white ${className}`}
    >
      <Icon size={16} aria-hidden="true" />
      {label && <span>{theme === "dark" ? "day mode" : "night mode"}</span>}
    </button>
  );
}