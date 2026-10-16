import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';
import { ColorScheme } from '../lib/themes';
import { setDynamicPalette } from '../lib/dynamicColor';

export const COLOR_SCHEMES: ColorScheme[] = ['green', 'blue', 'custom'];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  fontSize: 'normal' | 'large';
  setFontSize: (size: 'normal' | 'large') => void;
  toggleDarkQuick: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  customHue: number;
  setCustomHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('habitpulse_theme') as ThemeMode) || 'system';
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    return (localStorage.getItem('habitpulse_color_scheme') as ColorScheme) || 'green';
  });

  const [customHue, setCustomHueState] = useState<number>(() => {
    return Number(localStorage.getItem('habitpulse_custom_hue') || 258);
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('habitpulse_high_contrast') === 'true';
  });

  const [fontSize, setFontSizeState] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('habitpulse_font_size') as 'normal' | 'large') || 'normal';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to system dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('habitpulse_high_contrast', String(highContrast));
  }, [highContrast]);

  // Color scheme (Material You source palette) → data attribute / runtime palette
  useEffect(() => {
    const root = document.documentElement;
    if (colorScheme === 'green') {
      root.removeAttribute('data-color');
      setDynamicPalette(null);
    } else if (colorScheme === 'custom') {
      root.removeAttribute('data-color');
      setDynamicPalette(customHue);
    } else {
      root.setAttribute('data-color', colorScheme);
      setDynamicPalette(null);
    }
    localStorage.setItem('habitpulse_color_scheme', colorScheme);
  }, [colorScheme, customHue]);

  // Keep the browser-chrome tint (status bar in installed PWA) in sync
  useEffect(() => {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    const bg = style.getPropertyValue('--md-surface').trim();
    if (bg) {
      document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
        (meta as HTMLMetaElement).content = bg;
      });
    }
  }, [isDark, colorScheme, customHue]);

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'large') {
      root.classList.add('text-lg-scale');
    } else {
      root.classList.remove('text-lg-scale');
    }
    localStorage.setItem('habitpulse_font_size', fontSize);
  }, [fontSize]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('habitpulse_theme', newTheme);
  };

  const setHighContrast = (val: boolean) => {
    setHighContrastState(val);
  };

  const setFontSize = (size: 'normal' | 'large') => {
    setFontSizeState(size);
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const setCustomHue = (hue: number) => {
    setCustomHueState(hue);
    localStorage.setItem('habitpulse_custom_hue', String(Math.round(hue)));
  };

  const toggleDarkQuick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        highContrast,
        setHighContrast,
        fontSize,
        setFontSize,
        toggleDarkQuick,
        colorScheme,
        setColorScheme,
        customHue,
        setCustomHue,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
