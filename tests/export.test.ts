import {
  exportEventsCsv,
  exportEventsIcs,
  exportRecurringCsv,
  exportRecurringIcs
} from '../src/shared/export';
import { CalendarEvent, RecurringItem, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), ...patch };
}

const recurring: RecurringItem = {
  key: 'mom|3|15',
  subject: "Mom's Birthday",
  month: 3,
  day: 15,
  years: [2019, 2020, 2021],
  count: 3,
  category: 'Birthday',
  source: 'inferred'
};

describe('exportEventsCsv', () => {
  it('produces a header row and event rows', () => {
    const csv = exportEventsCsv([
      ev({ subject: 'Party', start_date: '2020-01-01', all_day: 1 })
    ]);
    expect(csv).toContain('Subject');
    expect(csv).toContain('Party');
    expect(csv).toContain('2020-01-01');
    expect(csv).toContain('True');
  });
});

describe('exportEventsIcs', () => {
  it('wraps events in a VCALENDAR with VEVENTs', () => {
    const ics = exportEventsIcs([
      ev({ subject: 'Meeting', start_date: '2020-03-05', start_time: '09:00', end_time: '10:00' })
    ]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Meeting');
    expect(ics).toContain('DTSTART:20200305T090000');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('emits VALUE=DATE for all-day events', () => {
    const ics = exportEventsIcs([ev({ subject: 'Holiday', start_date: '2020-12-25', all_day: 1 })]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20201225');
  });
});

describe('exportRecurringCsv', () => {
  it('lists each recurring item once with years joined', () => {
    const csv = exportRecurringCsv([recurring]);
    expect(csv).toContain("Mom's Birthday");
    expect(csv).toContain('2019 2020 2021');
    expect(csv).toContain('Birthday');
  });
});

describe('exportRecurringIcs', () => {
  it('emits one yearly-recurring VEVENT anchored on the earliest year', () => {
    const ics = exportRecurringIcs([recurring]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20190315');
    expect(ics).toContain('RRULE:FREQ=YEARLY');
    expect(ics).toContain("SUMMARY:Mom's Birthday");
  });
});
