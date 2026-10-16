export type ColorScheme = 'green' | 'blue';

/** Convert #rrggbb to rgba() with alpha — for canvas art over dark surfaces. */
export function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Dark-scheme accents for canvas art + confetti — kept in sync with the CSS token blocks. */
export const COLOR_SCHEME_ACCENTS: Record<ColorScheme, {
  /** MD3 dark-scheme primary (tone 80) — the accent on dark poster art */
  primaryDark: string;
  /** Dark surface background used by the poster */
  posterBg: string;
  /** Dark on-surface / secondary text on the poster */
  posterText: string;
  /** Dark neutral (on-surface tone 90) */
  posterSubtext: string;
  /** Confetti particle set */
  confetti: string[];
}> = {
  green: {
    primaryDark: '#7be193',
    posterBg: '#121412',
    posterText: '#e0e4e0',
    posterSubtext: '#eef2ef',
    confetti: ['#007232', '#7be193', '#98feaf', '#4c6651', '#ffffff'],
  },
  blue: {
    primaryDark: '#a4c9ff',
    posterBg: '#121416',
    posterText: '#e0e3e6',
    posterSubtext: '#eff1f4',
    confetti: ['#2a5da6', '#a4c9ff', '#d2e4ff', '#4f5f78', '#ffffff'],
  },
};

/** Demo palette previews shown in the Settings picker (light-scheme roles). */
export const COLOR_SCHEME_META: Record<ColorScheme, { label: string }> = {
  green: { label: 'Meadow' },
  blue: { label: 'Android Blue' },
};
