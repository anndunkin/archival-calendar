import { CalendarEvent } from './types';

/**
 * Fields included in full-text search. Organizer and attendees ARE searched
 * (same treatment as location/category): a common reason to look up an
 * archived meeting is to find it by who organized or attended it. rrule and
 * source_file are intentionally excluded — they are metadata, not content the
 * user reads or would search by.
 */
const SEARCHABLE_FIELDS: (keyof CalendarEvent)[] = [
  'subject',
  'description',
  'location',
  'category',
  'organizer',
  'required_attendees',
  'optional_attendees'
];

export function eventMatchesSearch(event: CalendarEvent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return SEARCHABLE_FIELDS.map((f) => event[f] ?? '')
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
  if (!query.trim()) return events;
  return events.filter((e) => eventMatchesSearch(e, query));
}
