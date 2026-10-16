/**
 * HabitPulse Sync Pack — backend-free cross-device sync.
 *
 * The entire library (routines, tasks, completions, journal, streak freezes,
 * milestones, settings/theme) is compressed into one opaque string, the
 * "Sync Pack". It travels anywhere the user can copy/paste or share:
 *  - "Copy code"  → paste the code into the Settings sheet on another device
 *  - "Share link" → https://fileus.vercel.app/#HBPULSE… opened on any device
 *                   auto-offers the restore
 *
 * Nothing is ever sent to a server: the data rides inside the code itself
 * (deflate-raw + base64url when CompressionStream is available, plain
 * base64url otherwise, so old/unsupported browsers still work).
 *
 * NOTE: the pack is readable by anyone who holds it (it's compressed, not
 * encrypted) — that is the trade-off for requiring no accounts/backends.
 */

const APP_TAG = 'HabitPulse';
const PACK_V = 1;

/** Keys carried in the pack — keep aligned with AppDataContext + ThemeContext. */
const PACK_KEYS: readonly string[] = [
  'habitpulse_guest_routines',
  'habitpulse_guest_tasks',
  'habitpulse_guest_completions',
  'habitpulse_guest_posts',
  'habitpulse_guest_journal',
  'habitpulse_freezes',
  'habitpulse_milestones_seen',
  'habitpulse_theme',
  'habitpulse_color_scheme',
  'habitpulse_custom_hue',
  'habitpulse_font_size',
  'habitpulse_high_contrast',
  'habitpulse_sync_code',
  'habitpulse_reminder_settings',
  'habitpulse_sound',
  'habitpulse_notifications',
];

/** deviceId is per-device and must NEVER travel in the pack. */
const NEVER_SYNC = new Set(['habitpulse_device_id']);

const PREFIX_COMPRESSED = 'HBPULSE1:';
const PREFIX_PLAIN = 'HBPULSE0:';

export interface SyncPackSummary {
  created: number;
  habits: number;
  historyDays: number;
  journalEntries: number;
  bytes: number;
}

export interface SyncPackPayload {
  app: string;
  v: number;
  created: number;
  keys: Record<string, string>;
  summary: SyncPackSummary;
}

// ---------------------------------------------------------------------------
// base64url helpers
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 === 0 ? norm : norm + '='.repeat(4 - (norm.length % 4));
  const bin = atob(pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

type TCompressionStream = {
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
};

function getStreamCtor(): (new (format: string) => TCompressionStream) | null {
  if (typeof globalThis.CompressionStream !== 'undefined') {
    return globalThis.CompressionStream as unknown as (new (format: string) => TCompressionStream);
  }
  return null;
}

async function pipeThrough(src: Uint8Array, ctor: new (format: string) => TCompressionStream): Promise<Uint8Array> {
  const cs = new ctor('deflate-raw');
  const writer = cs.writable.getWriter();
  void writer.write(src);
  void writer.close();
  const chunks: Uint8Array[] = [];
  const reader = cs.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Build / parse the pack
// ---------------------------------------------------------------------------

function collectLocalKeys(): Record<string, string> {
  const keys: Record<string, string> = {};
  try {
    // Known keys (canonical set)
    for (const k of PACK_KEYS) {
      const v = localStorage.getItem(k);
      if (v !== null) keys[k] = v;
    }
    // Forward-compat: also carry any other habitpulse_* value we might not know
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('habitpulse_') || NEVER_SYNC.has(k) || k in keys) continue;
      const v = localStorage.getItem(k);
      if (v !== null) keys[k] = v;
    }
  } catch {}
  return keys;
}

/** Current data summarized from the pack's keys (used by the restore sheet). */
export function summarizeKeys(keys: Record<string, string>): SyncPackSummary {
  const safeParse = <T,>(s: string | undefined, fallback: T): T => {
    if (!s) return fallback;
    try {
      return JSON.parse(s) as T;
    } catch {
      return fallback;
    }
  };
  const tasks = safeParse<unknown[]>(keys['habitpulse_guest_tasks'], []) as { isArchived?: boolean; id: string }[];
  const completions = safeParse<unknown[]>(keys['habitpulse_guest_completions'], []) as { date: string; taskId: string }[];
  const journal = safeParse<unknown[]>(keys['habitpulse_guest_journal'], []) as unknown[];
  const activeHabits = tasks.filter(t => !t.isArchived).length;
  const historyDays = new Set(completions.map(c => c.date)).size;
  const payloadSize = tasks.length + completions.length;
  return {
    created: 0,
    habits: activeHabits,
    historyDays,
    journalEntries: journal.length,
    bytes: payloadSize,
  };
}

/** Create the shareable code for the current device state. */
export async function buildSyncCode(): Promise<string> {
  const keys = collectLocalKeys();
  const payload: SyncPackPayload = {
    app: APP_TAG,
    v: PACK_V,
    created: Date.now(),
    keys,
    summary: summarizeKeys(keys),
  };
  const json = JSON.stringify(payload);

  const Comp = getStreamCtor();
  if (Comp) {
    try {
      const compressed = await pipeThrough(new TextEncoder().encode(json), Comp);
      return PREFIX_COMPRESSED + bytesToBase64Url(compressed);
    } catch {
      // fall through to plain encoding
    }
  }
  return PREFIX_PLAIN + bytesToBase64Url(new TextEncoder().encode(json));
}

/** Extract a pack code from arbitrary pasted text (code or full link). */
export function extractCodeFrom(text: string): string | null {
  const t = (text || '').trim().replace(/\s+/g, '');
  if (!t) return null;
  const idxC = t.indexOf(PREFIX_COMPRESSED);
  const idxP = t.indexOf(PREFIX_PLAIN);
  const from = Math.max(idxC, idxP);
  if (from >= 0) return t.slice(from);
  // Try URLs with the pack in a hash/query param
  return null;
}

export function packLink(code: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${code}`;
}

/** Read a pack code from the current URL (share links open e.g. /#HBPULSE1:…). */
export function codeFromLocation(): string | null {
  try {
    const candidates = [
      window.location.hash.slice(1),
      window.location.search.slice(1),
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const decoded = (() => {
        try {
          return decodeURIComponent(candidate);
        } catch {
          return candidate;
        }
      })();
      if (decoded.startsWith(PREFIX_COMPRESSED) || decoded.startsWith(PREFIX_PLAIN)) {
        return decoded;
      }
    }
  } catch {}
  return null;
}

/** Inflate + validate the code into a payload. Throws on corruption. */
export async function readSyncCode(code: string): Promise<SyncPackPayload> {
  const c = extractCodeFrom(code);
  if (!c) throw new Error('empty');
  const bytes = base64UrlToBytes(
    c.startsWith(PREFIX_COMPRESSED) ? c.slice(PREFIX_COMPRESSED.length) : c.startsWith(PREFIX_PLAIN) ? c.slice(PREFIX_PLAIN.length) : (() => { throw new Error('bad'); })()
  );
  const isPlain = c.startsWith(PREFIX_PLAIN);

  let json: string;
  if (isPlain) {
    json = new TextDecoder().decode(bytes);
  } else {
    const Dec = (globalThis.DecompressionStream as unknown as new (format: string) => TCompressionStream);
    const out = await pipeThrough(bytes, Dec);
    json = new TextDecoder().decode(out);
  }
  const payload = JSON.parse(json) as SyncPackPayload;
  if (payload.app !== APP_TAG || !payload.keys) throw new Error('foreign');
  return payload;
}

/** Write the pack's keys into localStorage, then the caller reloads. */
export function applySyncPack(payload: SyncPackPayload): void {
  for (const [k, v] of Object.entries(payload.keys)) {
    if (NEVER_SYNC.has(k)) continue;
    if (!k.startsWith('habitpulse_')) continue;
    try {
      localStorage.setItem(k, v);
    } catch {
      // quota — ignore single key failures
    }
  }
}

/** Clean the URL so a restore link doesn't re-trigger after a reload. */
export function scrubSyncUrl(): void {
  try {
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  } catch {}
}

/** Preload helper: unpack + compute the human summary shown before restore. */
export async function unpackForPreview(code: string): Promise<{ payload: SyncPackPayload; summary: SyncPackSummary }> {
  const payload = await readSyncCode(code);
  return { payload, summary: { ...payload.summary, created: payload.created } };
}
