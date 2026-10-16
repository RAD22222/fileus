import { toneHex } from './dynamicColor';

export type ColorScheme = 'green' | 'blue' | 'custom';

/** Convert #rrggbb to rgba() with alpha — for canvas art over dark surfaces. */
export function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace('#', '');
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface SchemeAccents {
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
}

/** Static dark-scheme accents for the built-in palettes. */
const SCHEME_ACCENTS: Record<'green' | 'blue', SchemeAccents> = {
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

/** Effective accents for any scheme — custom palettes are generated at runtime. */
export function getAccents(scheme: ColorScheme, customHue: number): SchemeAccents {
  if (scheme === 'custom') {
    const primaryDark = `#${toneHex(80, 0.13, customHue)}`;
    const posterText = `#${toneHex(90, 0.005, customHue)}`;
    const posterBg = `#${toneHex(6, 0.005, customHue)}`;
    return {
      primaryDark,
      posterBg,
      posterText,
      posterSubtext: posterText,
      confetti: [
        `#${toneHex(40, 0.13, customHue)}`,
        primaryDark,
        `#${toneHex(90, 0.13, customHue)}`,
        `#${toneHex(30, 0.045, customHue)}`,
        '#ffffff',
      ],
    };
  }
  return SCHEME_ACCENTS[scheme];
}

/** Demo palette previews shown in the Settings picker (light-scheme roles). */
export const COLOR_SCHEME_META: Record<ColorScheme, { label: string }> = {
  green: { label: 'Meadow' },
  blue: { label: 'Android Blue' },
  custom: { label: 'Custom color' },
};
