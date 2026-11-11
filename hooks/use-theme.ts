'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'fin-theme';

/**
 * Hook para controle do tema claro/escuro.
 * Persiste em localStorage e aplica `data-theme` no <html>.
 * Inclui proteção contra FOUC (flash of unstyled content).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}

