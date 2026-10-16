/**
 * Local-date helpers.
 *
 * NEVER use `new Date().toISOString().split('T')[0]` for day keys: toISOString
 * renders UTC, which shifts the label back a day for any timezone east of UTC
 * (e.g. India, +05:30). All day keys in the app must be composed from the
 * device-local calendar date.
 */

/** Format a Date as a local YYYY-MM-DD string. */
export function localDateStr(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Today as a local YYYY-MM-DD string. */
export function todayLocalStr(): string {
  return localDateStr(new Date());
}

/** Parse a YYYY-MM-DD string into a Date at LOCAL midnight. */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add days to a YYYY-MM-DD string, staying on local calendar dates. */
export function addDays(dateStr: string, delta: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}
