import { NewEvent, ParsedImport } from '../types';
import { normalizeDate, normalizeTime, parseAllDay } from '../dates';

const str = (v: unknown): string => (v == null ? '' : String(v).trim());

/**
 * Normalize a raw JSON record (used by the bundled sample seed and JSON import)
 * into a clean NewEvent. Accepts snake_case event fields directly.
 */
export function normalizeJsonRecord(raw: Record<string, unknown>): NewEvent | null {
  const subject = str(raw.subject ?? raw.title ?? raw.summary);
  const startDate = normalizeDate(str(raw.start_date ?? raw.date ?? raw.start));
  if (!subject && !startDate) return null;

  return {
    subject,
    start_date: startDate,
    start_time: normalizeTime(str(raw.start_time ?? raw.time)),
    end_date: normalizeDate(str(raw.end_date ?? raw.end)),
    end_time: normalizeTime(str(raw.end_time)),
    all_day: raw.all_day !== undefined ? parseAllDay(str(raw.all_day)) : 0,
    description: str(raw.description ?? raw.notes),
    location: str(raw.location ?? raw.place),
    category: str(raw.category ?? raw.categories),
    rrule: str(raw.rrule)
  };
}

export function parseJson(content: string): ParsedImport {
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) return { events: [] };
  const events = parsed
    .map((r) => normalizeJsonRecord(r as Record<string, unknown>))
    .filter((e): e is NewEvent => e !== null);
  return { events };
}
