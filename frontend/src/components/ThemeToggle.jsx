import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`text-sm text-slate-400 hover:text-white ${className}`}
    >
      {theme === "dark" ? "☀ day" : "☾ night"}
    </button>
  );
}