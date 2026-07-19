import {
  detectRecurringItems,
  categorize,
  normalizeSubject,
  similarity
} from '../src/shared/recurrence';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), ...patch };
}

describe('categorize', () => {
  it('classifies birthdays and anniversaries', () => {
    expect(categorize("Mom's Birthday")).toBe('Birthday');
    expect(categorize('Wedding Anniversary')).toBe('Anniversary');
    expect(categorize('Dentist')).toBe('Other');
  });
});

describe('normalizeSubject', () => {
  it('strips years, category words and punctuation', () => {
    expect(normalizeSubject("Mom's Birthday (2019)")).toBe('moms');
    expect(normalizeSubject('Moms bday')).toBe('moms');
  });
});

describe('similarity', () => {
  it('returns 1 for identical strings and less for edits', () => {
    expect(similarity('mom', 'mom')).toBe(1);
    expect(similarity('mom', 'mum')).toBeLessThan(1);
  });
});

describe('detectRecurringItems', () => {
  it('detects an item repeated on the same month/day across years (exact match)', () => {
    const events = [
      ev({ subject: "Mom's Birthday", start_date: '2019-03-15' }),
      ev({ subject: "Mom's Birthday", start_date: '2020-03-15' }),
      ev({ subject: "Mom's Birthday", start_date: '2021-03-15' })
    ];
    const items = detectRecurringItems(events);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      month: 3,
      day: 15,
      count: 3,
      category: 'Birthday',
      source: 'inferred'
    });
    expect(items[0].years).toEqual([2019, 2020, 2021]);
  });

  it('does not detect a one-off single-year event', () => {
    const events = [ev({ subject: 'Dentist', start_date: '2020-02-27' })];
    expect(detectRecurringItems(events)).toHaveLength(0);
  });

  it('qualifies immediately on RRULE FREQ=YEARLY even with a single year', () => {
    const events = [
      ev({ subject: 'Dad Bday', start_date: '2020-11-04', rrule: 'FREQ=YEARLY' })
    ];
    const items = detectRecurringItems(events);
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe('rrule');
  });

  it('requires fuzzy mode to group similar-but-different subjects', () => {
    const events = [
      ev({ subject: 'Katherine Birthday', start_date: '2019-03-15' }),
      ev({ subject: 'Katherin Birthday', start_date: '2020-03-15' })
    ];
    expect(detectRecurringItems(events, { fuzzy: false })).toHaveLength(0);
    const fuzzy = detectRecurringItems(events, { fuzzy: true });
    expect(fuzzy).toHaveLength(1);
    expect(fuzzy[0].years).toEqual([2019, 2020]);
  });

  it('handles Feb 29 leap-year dates as their own month/day bucket', () => {
    const events = [
      ev({ subject: 'Leap Day', start_date: '2016-02-29' }),
      ev({ subject: 'Leap Day', start_date: '2020-02-29' })
    ];
    const items = detectRecurringItems(events);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ month: 2, day: 29 });
  });
});
