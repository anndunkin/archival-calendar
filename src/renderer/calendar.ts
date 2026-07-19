export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO YYYY-MM-DD for a given year/month(1-12)/day. */
export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Build a 6-row (42-cell) month grid, Sunday-first. Each cell has the ISO date
 * and whether it belongs to the displayed month.
 */
export function monthGrid(
  year: number,
  month: number
): { date: string; day: number; inMonth: boolean }[] {
  const first = new Date(year, month - 1, 1);
  const startDow = first.getDay();
  const cells: { date: string; day: number; inMonth: boolean }[] = [];

  const gridStart = new Date(year, month - 1, 1 - startDow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1
    });
  }
  return cells;
}

export function todayIso(): string {
  const d = new Date();
  return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** "March 5, 2020" from an ISO date; passthrough if unparseable. */
export function formatLongDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${MONTH_NAMES[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

export function monthDayLabel(month: number, day: number): string {
  return `${MONTH_NAMES[month - 1]} ${day}`;
}
