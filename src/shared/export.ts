import Papa from 'papaparse';
import { CalendarEvent, RecurringItem } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Neutralize CSV/formula injection. Spreadsheet apps (Excel, Sheets, LibreOffice)
 * treat a cell whose text begins with =, +, -, @, or a leading tab/CR as a
 * formula, so a malicious imported event field like `=cmd|'/c calc'!A1` could
 * execute on export+open. Prefixing such values with a single quote forces the
 * cell to be interpreted as literal text without altering the visible content.
 */
export function sanitizeCsvField(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function icsEscape(value: string): string {
  return (value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function icsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/** Split a raw attendee list (semicolon or comma separated) into names. */
function splitAttendees(raw: string): string[] {
  return (raw ?? '')
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------- full-archive export ----------

export function exportEventsCsv(events: CalendarEvent[]): string {
  const rows = events.map((e) => ({
    Subject: sanitizeCsvField(e.subject),
    'Start Date': sanitizeCsvField(e.start_date),
    'Start Time': sanitizeCsvField(e.start_time),
    'End Date': sanitizeCsvField(e.end_date),
    'End Time': sanitizeCsvField(e.end_time),
    'All Day Event': e.all_day ? 'True' : 'False',
    Location: sanitizeCsvField(e.location),
    Description: sanitizeCsvField(e.description),
    Category: sanitizeCsvField(e.category),
    'Meeting Organizer': sanitizeCsvField(e.organizer),
    'Required Attendees': sanitizeCsvField(e.required_attendees),
    'Optional Attendees': sanitizeCsvField(e.optional_attendees),
    Source: sanitizeCsvField(e.source_file)
  }));
  return Papa.unparse(rows);
}

export function exportEventsIcs(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//anndunkin//Archival Calendar//EN'
  ];
  for (const e of events) {
    if (!e.start_date) continue;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:archival-${e.id ?? Math.random().toString(36).slice(2)}@anndunkin`);
    if (e.all_day || !e.start_time) {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(e.start_date)}`);
      if (e.end_date) lines.push(`DTEND;VALUE=DATE:${icsDate(e.end_date)}`);
    } else {
      lines.push(`DTSTART:${icsDate(e.start_date)}T${e.start_time.replace(':', '')}00`);
      const endDate = e.end_date || e.start_date;
      if (e.end_time) lines.push(`DTEND:${icsDate(endDate)}T${e.end_time.replace(':', '')}00`);
    }
    lines.push(`SUMMARY:${icsEscape(e.subject)}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.category) lines.push(`CATEGORIES:${icsEscape(e.category)}`);
    if (e.organizer) lines.push(`ORGANIZER;CN=${icsEscape(e.organizer)}:MAILTO:`);
    for (const a of splitAttendees(e.required_attendees)) {
      lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;CN=${icsEscape(a)}:MAILTO:`);
    }
    for (const a of splitAttendees(e.optional_attendees)) {
      lines.push(`ATTENDEE;ROLE=OPT-PARTICIPANT;CN=${icsEscape(a)}:MAILTO:`);
    }
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

// ---------- annual-recurring-items export ----------

export function exportRecurringCsv(items: RecurringItem[]): string {
  const rows = items.map((i) => ({
    Subject: sanitizeCsvField(i.subject),
    Month: pad(i.month),
    Day: pad(i.day),
    Category: sanitizeCsvField(i.category),
    Years: i.years.join(' '),
    Occurrences: i.count,
    Source: sanitizeCsvField(i.source)
  }));
  return Papa.unparse(rows);
}

/**
 * Export detected recurring items as a single ICS file of yearly-recurring
 * events. Each item becomes one VEVENT anchored on its earliest observed year
 * with RRULE:FREQ=YEARLY, so it can be fed into any calendar/reminder tool.
 */
export function exportRecurringIcs(items: RecurringItem[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//anndunkin//Archival Calendar//EN'
  ];
  for (const i of items) {
    const anchorYear = i.years[0] ?? new Date().getFullYear();
    const dt = `${anchorYear}${pad(i.month)}${pad(i.day)}`;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:recurring-${icsEscape(i.key)}@anndunkin`);
    lines.push(`DTSTART;VALUE=DATE:${dt}`);
    lines.push('RRULE:FREQ=YEARLY');
    lines.push(`SUMMARY:${icsEscape(i.subject)}`);
    lines.push(`CATEGORIES:${icsEscape(i.category)}`);
    lines.push(
      `DESCRIPTION:${icsEscape(
        `Annual ${i.category} detected across ${i.years.length} year(s): ${i.years.join(', ')}`
      )}`
    );
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
