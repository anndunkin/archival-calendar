import { normalizeDate, normalizeTime, partsOf, parseAllDay } from '../src/shared/dates';

describe('normalizeDate', () => {
  it('passes through ISO dates', () => {
    expect(normalizeDate('2020-03-05')).toBe('2020-03-05');
    expect(normalizeDate('2020-3-5')).toBe('2020-03-05');
    expect(normalizeDate('2020-03-05T09:00:00')).toBe('2020-03-05');
  });

  it('parses US M/D/Y', () => {
    expect(normalizeDate('3/5/2020')).toBe('2020-03-05');
    expect(normalizeDate('03/05/2020')).toBe('2020-03-05');
    expect(normalizeDate('3-5-20')).toBe('2020-03-05');
  });

  it('parses ICS basic dates', () => {
    expect(normalizeDate('20200305')).toBe('2020-03-05');
    expect(normalizeDate('20200305T090000Z')).toBe('2020-03-05');
  });

  it('parses textual months', () => {
    expect(normalizeDate('Mar 5, 2020')).toBe('2020-03-05');
    expect(normalizeDate('5 March 2020')).toBe('2020-03-05');
  });

  it('returns empty for unparseable input', () => {
    expect(normalizeDate('')).toBe('');
    expect(normalizeDate('not a date')).toBe('');
    expect(normalizeDate(null)).toBe('');
  });
});

describe('normalizeTime', () => {
  it('parses 12h am/pm', () => {
    expect(normalizeTime('9:00 AM')).toBe('09:00');
    expect(normalizeTime('9 PM')).toBe('21:00');
    expect(normalizeTime('12:30 PM')).toBe('12:30');
    expect(normalizeTime('12:00 AM')).toBe('00:00');
  });

  it('parses 24h', () => {
    expect(normalizeTime('09:00')).toBe('09:00');
    expect(normalizeTime('9:05')).toBe('09:05');
  });

  it('extracts time from ICS datetime', () => {
    expect(normalizeTime('20200305T093000Z')).toBe('09:30');
  });

  it('returns empty for none', () => {
    expect(normalizeTime('')).toBe('');
    expect(normalizeTime('all day')).toBe('');
  });
});

describe('partsOf', () => {
  it('splits an ISO date', () => {
    expect(partsOf('2020-03-05')).toEqual({ year: 2020, month: 3, day: 5 });
  });
  it('returns null for bad input', () => {
    expect(partsOf('2020-3-5')).toBeNull();
    expect(partsOf('')).toBeNull();
  });
});

describe('parseAllDay', () => {
  it('recognizes truthy values', () => {
    for (const v of ['true', 'Yes', 'Y', '1', 'on']) expect(parseAllDay(v)).toBe(1);
  });
  it('treats everything else as false', () => {
    for (const v of ['false', 'no', '0', '', 'maybe']) expect(parseAllDay(v)).toBe(0);
  });
});
