export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

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

/** Add (or subtract) whole days to an ISO date, handling month/year rollover. */
export function addDays(iso: string, n: number): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n);
  return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** ISO date of the Sunday that begins the week containing `iso`. */
export function weekStart(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate() - d.getDay());
}

/** The 7 Sun–Sat dates of the week containing `iso`. */
export function weekDates(iso: string): { date: string; day: number }[] {
  const start = weekStart(iso);
  const out: { date: string; day: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    out.push({ date, day: Number(date.slice(8, 10)) });
  }
  return out;
}

/** "Tuesday, July 21, 2026" from an ISO date; passthrough if unparseable. */
export function formatFullDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${WEEKDAY_NAMES[d.getDay()]}, ${MONTH_NAMES[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/**
 * "Jul 19 – Jul 25, 2026" for a week range, collapsing the year when both ends
 * share it and expanding it on year boundaries ("Dec 29, 2026 – Jan 4, 2027").
 */
export function formatWeekRange(startIso: string, endIso: string): string {
  const s = startIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const e = endIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!s || !e) return `${startIso} – ${endIso}`;
  const sMon = MONTH_NAMES[Number(s[2]) - 1].slice(0, 3);
  const eMon = MONTH_NAMES[Number(e[2]) - 1].slice(0, 3);
  const sDay = Number(s[3]);
  const eDay = Number(e[3]);
  if (s[1] !== e[1]) {
    return `${sMon} ${sDay}, ${s[1]} – ${eMon} ${eDay}, ${e[1]}`;
  }
  return `${sMon} ${sDay} – ${eMon} ${eDay}, ${e[1]}`;
}
