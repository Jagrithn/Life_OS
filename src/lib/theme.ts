import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const KEY = "ordo:theme";
const MEDIA = "(prefers-color-scheme: dark)";
const LIGHT_CHROME = "#ffffff";
const DARK_CHROME = "#17171a";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(MEDIA).matches;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
}

function syncThemeChrome(resolved: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? DARK_CHROME : LIGHT_CHROME);
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  syncThemeChrome(resolved);
}

// A module-level listener set keeps every mounted toggle in sync.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emit() {
  for (const listener of listeners) listener();
}

export function setTheme(theme: Theme) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, theme);
    } catch {
      /* storage unavailable (private mode) — apply for this session only */
    }
  }
  applyTheme(theme);
  emit();
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "system" as Theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => {
      applyTheme("system");
      emit();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const update = useCallback((next: Theme) => setTheme(next), []);

  return { theme, resolved: resolveTheme(theme), setTheme: update };
}

// Runs before first paint to prevent a flash of the wrong theme. Kept dependency-free.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('ordo:theme')||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
