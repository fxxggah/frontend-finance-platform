'use client';
import { useSyncExternalStore } from 'react';
export type Theme = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'fin-theme';
const THEME_EVENT = 'fin:theme-change';
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(event.newValue === 'dark' ? 'dark' : 'light'); onChange();
    }
  };
  window.addEventListener(THEME_EVENT, onChange); window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(THEME_EVENT, onChange); window.removeEventListener('storage', onStorage); };
}
function getSnapshot(): Theme { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function setTheme(theme: Theme) {
  applyTheme(theme);
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Tema funciona sem armazenamento. */ }
  window.dispatchEvent(new Event(THEME_EVENT));
}
/** Snapshot SSR estável; o script no head aplica a preferência antes da pintura. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light' as const);
  return { theme, isDark: theme === 'dark', setTheme, toggleTheme: () => setTheme(getSnapshot() === 'dark' ? 'light' : 'dark') };
}
