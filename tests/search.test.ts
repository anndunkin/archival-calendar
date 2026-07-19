import { searchEvents, eventMatchesSearch } from '../src/shared/search';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), ...patch };
}

describe('searchEvents', () => {
  const events = [
    ev({ subject: 'Standup', start_date: '2020-01-01', organizer: 'Jane Smith' }),
    ev({
      subject: 'Planning',
      start_date: '2020-01-02',
      required_attendees: 'John Doe; Sam Lee'
    }),
    ev({ subject: 'Lunch', start_date: '2020-01-03', optional_attendees: 'Alex Kim' })
  ];

  it('returns all events for an empty query', () => {
    expect(searchEvents(events, '   ')).toHaveLength(3);
  });

  // Organizer/attendees ARE searchable (documented decision in src/shared/search.ts).
  it('matches on organizer name', () => {
    expect(searchEvents(events, 'jane').map((e) => e.subject)).toEqual(['Standup']);
  });

  it('matches on required attendees', () => {
    expect(searchEvents(events, 'sam lee').map((e) => e.subject)).toEqual(['Planning']);
  });

  it('matches on optional attendees', () => {
    expect(searchEvents(events, 'alex').map((e) => e.subject)).toEqual(['Lunch']);
  });

  it('still matches subject as before', () => {
    expect(searchEvents(events, 'plan').map((e) => e.subject)).toEqual(['Planning']);
  });

  it('does not match on excluded metadata (source_file)', () => {
    const withSource = [ev({ subject: 'X', start_date: '2020-01-01', source_file: 'secret.csv' })];
    expect(eventMatchesSearch(withSource[0], 'secret.csv')).toBe(false);
  });
});
