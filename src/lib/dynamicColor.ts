/**
 * Runtime Material 3 palette generation — true Material You dynamic color.
 * Generates a full tonal scheme (light + dark) from an arbitrary source hue,
 * applied through a ConstructedStyleSheet so it overrides the static
 * green/blue theme blocks whenever the user picks "Custom".
 */

const PRIMARY_C = 0.13;
const SECONDARY_C = 0.045;
const NEUTRAL_C = 0.005;
const NVARIANT_C = 0.016;
const CHROMA_STEP = 0.0005;

function linRGB(L: number, a: number, b: number): number[] {
  const lms = [
    L + 0.3963377774 * a + 0.2158037573 * b,
    L - 0.1055613458 * a - 0.0638541728 * b,
    L - 0.0894841775 * a - 1.2914855480 * b,
  ].map(v => v ** 3);
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.7076147010 * lms[2],
  ];
}

export function toneHex(T: number, C: number, hueDeg: number): string {
  const L = (T + 16) / 116;
  const h = (hueDeg * Math.PI) / 180;
  let c = C;
  let lin: number[];
  for (let i = 0; i < 200 && c >= 0; i++) {
    lin = linRGB(L, c * Math.cos(h), c * Math.sin(h));
    if (lin.every(v => v >= -0.0015 && v <= 1.0015)) break;
    c = Math.max(0, c - CHROMA_STEP);
  }
  lin = linRGB(L, Math.max(0, c) * Math.cos(h), Math.max(0, c) * Math.sin(h));
  const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  return lin
    .map(v => Math.round(Math.min(1, Math.max(0, gamma(v))) * 255).toString(16).padStart(2, '0'))
    .join('');
}

function rampBlock(hue: number, dark: boolean): string {
  const P = (t: number) => toneHex(t, PRIMARY_C, hue);
  const S = (t: number) => toneHex(t, SECONDARY_C, hue);
  const N = (t: number) => toneHex(t, NEUTRAL_C, hue);
  const NV = (t: number) => toneHex(t, NVARIANT_C, hue);

  const light = {
    '--md-primary': P(40), '--md-on-primary': P(100),
    '--md-primary-container': P(90), '--md-on-primary-container': P(10),
    '--md-secondary': S(40), '--md-on-secondary': S(100),
    '--md-secondary-container': S(90), '--md-on-secondary-container': S(10),
    '--md-surface': N(98), '--md-on-surface': N(10),
    '--md-surface-variant': NV(90), '--md-on-surface-variant': NV(30),
    '--md-surface-container-lowest': N(100), '--md-surface-container-low': N(96),
    '--md-surface-container': N(94), '--md-surface-container-high': N(92),
    '--md-surface-container-highest': N(90),
    '--md-outline': NV(50), '--md-outline-variant': NV(80),
    '--md-inverse-surface': N(20), '--md-inverse-on-surface': N(95),
    '--md-inverse-primary': P(80),
  };
  const darkTokens = {
    '--md-primary': P(80), '--md-on-primary': P(20),
    '--md-primary-container': P(30), '--md-on-primary-container': P(90),
    '--md-secondary': S(80), '--md-on-secondary': S(20),
    '--md-secondary-container': S(30), '--md-on-secondary-container': S(90),
    '--md-surface': N(6), '--md-on-surface': N(90),
    '--md-surface-variant': NV(30), '--md-on-surface-variant': NV(80),
    '--md-surface-container-lowest': N(4), '--md-surface-container-low': N(10),
    '--md-surface-container': N(12), '--md-surface-container-high': N(17),
    '--md-surface-container-highest': N(22),
    '--md-outline': NV(60), '--md-outline-variant': NV(30),
    '--md-inverse-surface': N(90), '--md-inverse-on-surface': N(20),
    '--md-inverse-primary': P(40),
  };
  const tokens = dark ? darkTokens : light;
  return Object.entries(tokens).map(([k, v]) => `${k}:#${v};`).join('');
}

let dynamicSheet: CSSStyleSheet | null = null;

/** Apply a runtime palette for the given hue (0-360). Pass null to remove. */
export function setDynamicPalette(hue: number | null): void {
  if (!CSSStyleSheet || !('adoptedStyleSheets' in document)) return;

  if (hue === null) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== dynamicSheet);
    dynamicSheet = null;
    return;
  }

  const css = `html{${rampBlock(hue, false)}}html.dark{${rampBlock(hue, true)}}`;
  if (dynamicSheet) {
    dynamicSheet.replaceSync(css);
  } else {
    dynamicSheet = new CSSStyleSheet();
    dynamicSheet.replaceSync(css);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, dynamicSheet];
  }
}
