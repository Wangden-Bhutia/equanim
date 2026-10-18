/** Local calendar date as YYYY-MM-DD (device time zone). */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function keyFromIso(iso: string): string {
  return dateKey(new Date(iso));
}

export function addDays(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return dateKey(dt);
}

export function formatLongDate(d: Date = new Date()): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dayIndex(key: string): number {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
