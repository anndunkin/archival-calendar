const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Normalize a wide range of date strings into ISO `YYYY-MM-DD`, or '' if it
 * can't be understood. Handles:
 *  - ISO (2020-03-05, 2020-03-05T09:00:00)
 *  - US M/D/Y (3/5/2020, 03/05/2020)
 *  - ICS basic (20200305 or 20200305T090000Z)
 *  - "Mar 5, 2020" / "5 March 2020"
 */
export function normalizeDate(raw: string | undefined | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '';

  // ICS basic date/datetime: 20200305 or 20200305T090000Z
  const icsMatch = s.match(/^(\d{4})(\d{2})(\d{2})(T|$)/);
  if (icsMatch) {
    return `${icsMatch[1]}-${icsMatch[2]}-${icsMatch[3]}`;
  }

  // ISO-ish: 2020-03-05 (optionally with time)
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${pad(Number(isoMatch[2]))}-${pad(Number(isoMatch[3]))}`;
  }

  // US slash/dash M/D/Y or M-D-Y
  const usMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (usMatch) {
    let year = Number(usMatch[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    return `${year}-${pad(Number(usMatch[1]))}-${pad(Number(usMatch[2]))}`;
  }

  // Textual month: "Mar 5, 2020" or "5 March 2020"
  const textMatch = s.match(/([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (textMatch) {
    const mon = MONTHS[textMatch[1].slice(0, 3).toLowerCase()];
    if (mon) return `${textMatch[3]}-${pad(mon)}-${pad(Number(textMatch[2]))}`;
  }
  const textMatch2 = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{4})/);
  if (textMatch2) {
    const mon = MONTHS[textMatch2[2].slice(0, 3).toLowerCase()];
    if (mon) return `${textMatch2[3]}-${pad(mon)}-${pad(Number(textMatch2[1]))}`;
  }

  return '';
}

/** Normalize a time string to 24h `HH:MM`, or '' if not understood. */
export function normalizeTime(raw: string | undefined | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '';

  // ICS datetime: extract Thhmmss
  const icsTime = s.match(/T(\d{2})(\d{2})(\d{2})?/);
  if (icsTime) return `${icsTime[1]}:${icsTime[2]}`;

  // 12h with am/pm: "9:00 AM", "9 PM"
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i);
  if (ampm) {
    let hour = Number(ampm[1]) % 12;
    if (/p/i.test(ampm[3])) hour += 12;
    return `${pad(hour)}:${ampm[2] ?? '00'}`;
  }

  // 24h "09:00" / "9:00" / ISO "...T09:00:00"
  const h24 = s.match(/(\d{1,2}):(\d{2})/);
  if (h24) return `${pad(Number(h24[1]))}:${h24[2]}`;

  return '';
}

/** Parse an ISO date string into {year, month, day}, or null. */
export function partsOf(isoDate: string): { year: number; month: number; day: number } | null {
  const m = (isoDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

const TRUE_VALUES = new Set(['true', 'yes', 'y', '1', 'on']);

export function parseAllDay(raw: string | undefined | null): number {
  return TRUE_VALUES.has((raw ?? '').toString().trim().toLowerCase()) ? 1 : 0;
}
