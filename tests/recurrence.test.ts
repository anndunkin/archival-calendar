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

  it('still detects a genuine annual item across 3 years (regression guard)', () => {
    const events = [
      ev({ subject: "Grandma's Anniversary", start_date: '2018-06-10' }),
      ev({ subject: "Grandma's Anniversary", start_date: '2019-06-10' }),
      ev({ subject: "Grandma's Anniversary", start_date: '2020-06-10' })
    ];
    const items = detectRecurringItems(events);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ month: 6, day: 10, count: 3 });
    expect(items[0].years).toEqual([2018, 2019, 2020]);
  });

  it('excludes a recurring meeting even when two instances coincidentally share a month/day', () => {
    // A weekly team sync exported one row per occurrence, scattered across many
    // dates, with one coincidental collision on 03-15 across two years.
    const events = [
      ev({ subject: 'Weekly Team Sync', start_date: '2019-03-15' }),
      ev({ subject: 'Weekly Team Sync', start_date: '2020-03-15' }), // coincidental collision
      ev({ subject: 'Weekly Team Sync', start_date: '2019-03-22' }),
      ev({ subject: 'Weekly Team Sync', start_date: '2019-04-05' }),
      ev({ subject: 'Weekly Team Sync', start_date: '2020-01-07' }),
      ev({ subject: 'Weekly Team Sync', start_date: '2020-11-18' })
    ];
    // Without the filter, the 03-15 pair (2 distinct years) would qualify.
    expect(detectRecurringItems(events)).toHaveLength(0);
  });

  it('does not let a single RRULE-yearly instance whitewash a scattered recurring subject', () => {
    // Same subject on many different dates (a meeting), but one stray instance
    // was miscategorized with an RRULE:FREQ=YEARLY. It should still be excluded
    // because 2+ distinct non-RRULE dates exist for the subject.
    const events = [
      ev({ subject: 'Project Standup', start_date: '2020-02-03' }),
      ev({ subject: 'Project Standup', start_date: '2020-05-19' }),
      ev({ subject: 'Project Standup', start_date: '2020-09-28' }),
      ev({ subject: 'Project Standup', start_date: '2021-01-11', rrule: 'FREQ=YEARLY' })
    ];
    expect(detectRecurringItems(events)).toHaveLength(0);
  });

  it('trusts an RRULE-yearly item whose only non-RRULE instances share one date', () => {
    const events = [
      ev({ subject: 'Company Founding Day', start_date: '2020-08-01', rrule: 'FREQ=YEARLY' }),
      ev({ subject: 'Company Founding Day', start_date: '2021-08-01' })
    ];
    const items = detectRecurringItems(events);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ month: 8, day: 1, source: 'rrule' });
  });

  it('merges fuzzy subject variants before counting distinct dates', () => {
    // Near-identical subjects across different dates must be merged so the
    // meeting is excluded rather than surviving as separate subjects.
    const events = [
      ev({ subject: '1:1 with Alex', start_date: '2019-07-02' }),
      ev({ subject: '1:1 with Alex', start_date: '2020-07-02' }), // coincidental collision
      ev({ subject: '1:1 with Alexx', start_date: '2019-09-14' }),
      ev({ subject: '1:1 with Alex', start_date: '2020-12-01' })
    ];
    // Exact mode: the '1:1 with Alex' variant collides on 07-02 across 2 years.
    expect(detectRecurringItems(events, { fuzzy: false })).toHaveLength(0);
    // Fuzzy mode: variants merge, subject spans 3 distinct dates -> excluded.
    expect(detectRecurringItems(events, { fuzzy: true })).toHaveLength(0);
  });
});
