import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StatusBar, Style } from "@capacitor/status-bar";

export type AppTheme = "dark" | "grey" | "light";

const STORAGE_KEY = "jukeboxd-theme";

const THEME_COLOR: Record<AppTheme, string> = {
  dark: "#000000",
  grey: "#18181b",
  light: "#f4f4f5",
};

function readStoredTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "grey" || raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

function applyDomTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
}

type ThemeContextValue = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => readStoredTheme());

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    applyDomTheme(t);
  }, []);

  useEffect(() => {
    applyDomTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncStatusBar = async () => {
      try {
        await StatusBar.setStyle({
          style: theme === "light" ? Style.Light : Style.Dark,
        });
      } catch {
        /* Capacitor not available in browser */
      }
    };
    syncStatusBar();
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
