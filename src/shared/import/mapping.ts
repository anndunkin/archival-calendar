import { FieldMapping, CalendarEvent, EVENT_FIELDS } from '../types';

/** Heuristic aliases mapping common calendar CSV headers to event fields. */
const ALIASES: Record<string, keyof CalendarEvent> = {
  subject: 'subject',
  title: 'subject',
  summary: 'subject',
  event: 'subject',
  name: 'subject',
  'start date': 'start_date',
  startdate: 'start_date',
  date: 'start_date',
  'begin date': 'start_date',
  start: 'start_date',
  'start time': 'start_time',
  starttime: 'start_time',
  time: 'start_time',
  'begin time': 'start_time',
  'end date': 'end_date',
  enddate: 'end_date',
  'finish date': 'end_date',
  'end time': 'end_time',
  endtime: 'end_time',
  'finish time': 'end_time',
  'all day event': 'all_day',
  'all day': 'all_day',
  'all-day': 'all_day',
  allday: 'all_day',
  location: 'location',
  place: 'location',
  venue: 'location',
  where: 'location',
  description: 'description',
  notes: 'description',
  note: 'description',
  details: 'description',
  body: 'description',
  category: 'category',
  categories: 'category',
  type: 'category',
  tag: 'category',
  tags: 'category',
  'meeting organizer': 'organizer',
  organizer: 'organizer',
  organiser: 'organizer',
  'meeting organiser': 'organizer',
  host: 'organizer',
  'required attendees': 'required_attendees',
  'required attendee': 'required_attendees',
  attendees: 'required_attendees',
  attendee: 'required_attendees',
  participants: 'required_attendees',
  'optional attendees': 'optional_attendees',
  'optional attendee': 'optional_attendees'
};

export function autoGuessMapping(headers: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  const fieldSet = new Set<string>(EVENT_FIELDS as string[]);
  for (const header of headers) {
    const key = header.trim().toLowerCase();
    const direct = fieldSet.has(key) ? (key as keyof CalendarEvent) : undefined;
    mapping[header] = direct ?? ALIASES[key] ?? '';
  }
  return mapping;
}
