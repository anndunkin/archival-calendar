import { parseIcs } from '../src/shared/import/ics';

const SAMPLE = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'SUMMARY:Team Meeting',
  'DTSTART:20200305T090000Z',
  'DTEND:20200305T100000Z',
  'LOCATION:Room 1',
  'DESCRIPTION:Quarterly sync\\, all hands',
  'CATEGORIES:Work',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'SUMMARY:Birthday',
  'DTSTART;VALUE=DATE:20200410',
  'RRULE:FREQ=YEARLY',
  'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');

describe('parseIcs', () => {
  it('parses timed events with location, description and category', () => {
    const { events } = parseIcs(SAMPLE);
    expect(events).toHaveLength(2);
    const timed = events[0];
    expect(timed).toMatchObject({
      subject: 'Team Meeting',
      start_date: '2020-03-05',
      start_time: '09:00',
      end_time: '10:00',
      location: 'Room 1',
      category: 'Work'
    });
    expect(timed.description).toBe('Quarterly sync, all hands');
  });

  it('flags date-only events as all-day and preserves RRULE', () => {
    const { events } = parseIcs(SAMPLE);
    const allDay = events[1];
    expect(allDay).toMatchObject({
      subject: 'Birthday',
      start_date: '2020-04-10',
      all_day: 1,
      rrule: 'FREQ=YEARLY'
    });
    expect(allDay.start_time).toBeUndefined();
  });

  it('parses ORGANIZER and ATTENDEE (required + optional) into the new fields', () => {
    const ics = [
      'BEGIN:VEVENT',
      'SUMMARY:Sync',
      'DTSTART:20200305T090000Z',
      'ORGANIZER;CN=Jane Smith:mailto:jane@example.com',
      'ATTENDEE;ROLE=REQ-PARTICIPANT;CN=John Doe:mailto:john@example.com',
      'ATTENDEE;ROLE=REQ-PARTICIPANT;CN=Jane Smith:mailto:jane@example.com',
      'ATTENDEE;ROLE=OPT-PARTICIPANT;CN=Sam Lee:mailto:sam@example.com',
      'END:VEVENT'
    ].join('\r\n');
    const { events } = parseIcs(ics);
    expect(events[0].organizer).toBe('Jane Smith');
    expect(events[0].required_attendees).toBe('John Doe; Jane Smith');
    expect(events[0].optional_attendees).toBe('Sam Lee');
  });

  it('falls back to the mailto address when no CN is present', () => {
    const ics = [
      'BEGIN:VEVENT',
      'SUMMARY:Sync',
      'DTSTART:20200305T090000Z',
      'ATTENDEE:mailto:nocn@example.com',
      'END:VEVENT'
    ].join('\r\n');
    const { events } = parseIcs(ics);
    expect(events[0].required_attendees).toBe('nocn@example.com');
  });

  it('unfolds folded continuation lines', () => {
    const folded = [
      'BEGIN:VEVENT',
      'SUMMARY:A very long ',
      ' event title',
      'DTSTART:20200101',
      'END:VEVENT'
    ].join('\r\n');
    const { events } = parseIcs(folded);
    expect(events[0].subject).toBe('A very long event title');
  });
});
