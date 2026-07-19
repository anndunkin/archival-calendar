import Papa from 'papaparse';
import { NewEvent, FieldMapping, CalendarEvent, ParsedImport } from '../types';
import { autoGuessMapping } from './mapping';
import { normalizeDate, normalizeTime, parseAllDay } from '../dates';

/**
 * Parse CSV content into headers + rows and an auto-mapped event list. The
 * caller may re-map columns via the FieldMapper dialog and re-run applyMapping.
 */
export function parseCsv(content: string): ParsedImport {
  const result = Papa.parse<string[]>(content.trim(), { skipEmptyLines: true });
  const data = result.data as string[][];
  if (data.length === 0) {
    return { events: [], headers: [], rows: [] };
  }
  const headers = data[0].map((h) => String(h).trim());
  const rows = data.slice(1);
  const mapping = autoGuessMapping(headers);
  const events = applyMapping(headers, rows, mapping);
  return { events, headers, rows };
}

/** Build events from raw rows given an explicit header -> field mapping. */
export function applyMapping(
  headers: string[],
  rows: string[][],
  mapping: FieldMapping
): NewEvent[] {
  return rows
    .map((row) => {
      const raw: Partial<Record<keyof CalendarEvent, string>> = {};
      headers.forEach((header, idx) => {
        const field = mapping[header];
        if (field) {
          const value = (row[idx] ?? '').toString().trim();
          if (value) raw[field] = value;
        }
      });
      return normalizeRawEvent(raw);
    })
    .filter((e): e is NewEvent => e !== null);
}

/** Convert loosely-typed mapped columns into a clean NewEvent (or null). */
export function normalizeRawEvent(
  raw: Partial<Record<keyof CalendarEvent, string>>
): NewEvent | null {
  const startDate = normalizeDate(raw.start_date);
  const subject = (raw.subject ?? '').trim();
  // Require at least a subject or a parseable start date to be a real event.
  if (!subject && !startDate) return null;

  const event: NewEvent = {};
  if (subject) event.subject = subject;
  if (startDate) event.start_date = startDate;
  const startTime = normalizeTime(raw.start_time);
  if (startTime) event.start_time = startTime;
  const endDate = normalizeDate(raw.end_date);
  if (endDate) event.end_date = endDate;
  const endTime = normalizeTime(raw.end_time);
  if (endTime) event.end_time = endTime;
  if (raw.all_day !== undefined) event.all_day = parseAllDay(raw.all_day);
  if (raw.location) event.location = raw.location.trim();
  if (raw.description) event.description = raw.description.trim();
  if (raw.category) event.category = raw.category.trim();
  return event;
}
