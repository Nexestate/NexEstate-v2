import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'nexestate-a11y';

export interface AccessibilitySettings {
  textScale: number;
  highContrast: boolean;
  largeCursor: boolean;
  reduceMotion: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  textScale: 100,
  highContrast: false,
  largeCursor: false,
  reduceMotion: false,
};

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  setTextScale: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleLargeCursor: () => void;
  toggleReduceMotion: () => void;
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.style.fontSize = `${settings.textScale}%`;
  root.classList.toggle('a11y-high-contrast', settings.highContrast);
  root.classList.toggle('a11y-large-cursor', settings.largeCursor);
  root.classList.toggle('a11y-reduce-motion', settings.reduceMotion);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setTextScale = useCallback((scale: number) => {
    setSettings((s) => ({ ...s, textScale: Math.min(150, Math.max(80, scale)) }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings((s) => ({ ...s, highContrast: !s.highContrast }));
  }, []);

  const toggleLargeCursor = useCallback(() => {
    setSettings((s) => ({ ...s, largeCursor: !s.largeCursor }));
  }, []);

  const toggleReduceMotion = useCallback(() => {
    setSettings((s) => ({ ...s, reduceMotion: !s.reduceMotion }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      setTextScale,
      toggleHighContrast,
      toggleLargeCursor,
      toggleReduceMotion,
      resetSettings,
    }),
    [settings, setTextScale, toggleHighContrast, toggleLargeCursor, toggleReduceMotion, resetSettings],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
