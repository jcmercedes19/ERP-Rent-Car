import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore } from "../../app/store/useThemeStore";

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex items-center space-x-1 bg-secondary/50 backdrop-blur-md border border-border p-1 rounded-full shadow-sm">
      <button
        onClick={() => setTheme("light")}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "light"
            ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light Mode"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "system"
            ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System Preference"
      >
        <Monitor size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded-full transition-all duration-300 ${
          theme === "dark"
            ? "bg-white text-black shadow-sm dark:bg-zinc-800 dark:text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark Mode"
      >
        <Moon size={16} />
      </button>
    </div>
  );
}
