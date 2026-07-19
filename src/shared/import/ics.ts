import { NewEvent, ParsedImport } from '../types';
import { normalizeDate, normalizeTime } from '../dates';

interface RawLine {
  name: string;
  params: Record<string, string>;
  value: string;
}

/** Unfold RFC 5545 folded lines (continuation lines start with space/tab). */
function unfold(content: string): string[] {
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines: string[] = [];
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1);
    } else {
      lines.push(line);
    }
  }
  return lines;
}

function parseLine(line: string): RawLine | null {
  const colon = line.indexOf(':');
  if (colon === -1) return null;
  const left = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const segments = left.split(';');
  const name = segments[0].toUpperCase();
  const params: Record<string, string> = {};
  for (const seg of segments.slice(1)) {
    const eq = seg.indexOf('=');
    if (eq !== -1) params[seg.slice(0, eq).toUpperCase()] = seg.slice(eq + 1);
  }
  return { name, params, value };
}

/** Unescape an iCalendar TEXT value (\\ \, \; \n). */
function unescapeText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** True when a DTSTART/DTEND is a date-only value (all-day event). */
function isDateOnly(l: RawLine): boolean {
  return l.params.VALUE === 'DATE' || /^\d{8}$/.test(l.value.trim());
}

/**
 * Parse an .ics file into events. RRULE and CATEGORIES are preserved; all-day
 * events (VALUE=DATE) are flagged. Dependency-free: handles line unfolding,
 * parameter parsing and TEXT unescaping.
 */
export function parseIcs(content: string): ParsedImport {
  const lines = unfold(content);
  const events: NewEvent[] = [];
  let current: NewEvent | null = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (trimmed === 'END:VEVENT') {
      if (current && (current.subject || current.start_date)) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const l = parseLine(rawLine);
    if (!l) continue;

    switch (l.name) {
      case 'SUMMARY':
        current.subject = unescapeText(l.value).trim();
        break;
      case 'DTSTART':
        current.start_date = normalizeDate(l.value);
        if (isDateOnly(l)) {
          current.all_day = 1;
        } else {
          const t = normalizeTime(l.value);
          if (t) current.start_time = t;
        }
        break;
      case 'DTEND':
        current.end_date = normalizeDate(l.value);
        if (!isDateOnly(l)) {
          const t = normalizeTime(l.value);
          if (t) current.end_time = t;
        }
        break;
      case 'DESCRIPTION':
        current.description = unescapeText(l.value).trim();
        break;
      case 'LOCATION':
        current.location = unescapeText(l.value).trim();
        break;
      case 'CATEGORIES':
        current.category = unescapeText(l.value).trim();
        break;
      case 'RRULE':
        current.rrule = l.value.trim();
        break;
      default:
        break;
    }
  }

  return { events };
}
