import {
  addDays,
  weekStart,
  weekDates,
  formatFullDate,
  formatWeekRange,
  isoDate
} from '../src/renderer/calendar';

describe('addDays', () => {
  it('steps forward and backward by whole days', () => {
    expect(addDays('2026-07-21', 1)).toBe('2026-07-22');
    expect(addDays('2026-07-21', -1)).toBe('2026-07-20');
    expect(addDays('2026-07-21', 7)).toBe('2026-07-28');
    expect(addDays('2026-07-21', -7)).toBe('2026-07-14');
  });

  it('rolls over month and year boundaries', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31'); // back a day across year
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01'); // forward a day across year
    expect(addDays('2026-03-31', 1)).toBe('2026-04-01'); // month boundary
    expect(addDays('2026-12-29', 7)).toBe('2027-01-05'); // week crosses year
  });
});

describe('weekStart / weekDates', () => {
  it('finds the Sunday that starts the week (Sunday-first)', () => {
    // 2026-07-21 is a Tuesday; the week starts Sunday 2026-07-19.
    expect(weekStart('2026-07-21')).toBe('2026-07-19');
    // A Sunday is its own week start.
    expect(weekStart('2026-07-19')).toBe('2026-07-19');
  });

  it('returns 7 consecutive Sun–Sat dates', () => {
    const dates = weekDates('2026-07-21');
    expect(dates).toHaveLength(7);
    expect(dates.map((d) => d.date)).toEqual([
      '2026-07-19',
      '2026-07-20',
      '2026-07-21',
      '2026-07-22',
      '2026-07-23',
      '2026-07-24',
      '2026-07-25'
    ]);
    expect(dates.map((d) => d.day)).toEqual([19, 20, 21, 22, 23, 24, 25]);
  });

  it('handles a week spanning a year boundary', () => {
    // 2026-12-31 is a Thursday; its week starts Sunday 2026-12-27 and ends
    // Saturday 2027-01-02.
    const dates = weekDates('2026-12-31');
    expect(dates[0].date).toBe('2026-12-27');
    expect(dates[6].date).toBe('2027-01-02');
  });
});

describe('formatFullDate', () => {
  it('renders weekday, month name, day and year', () => {
    expect(formatFullDate('2026-07-21')).toBe('Tuesday, July 21, 2026');
  });

  it('passes through unparseable input', () => {
    expect(formatFullDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatWeekRange', () => {
  it('collapses the year for a same-year week', () => {
    expect(formatWeekRange('2026-07-19', '2026-07-25')).toBe('Jul 19 – Jul 25, 2026');
  });

  it('expands both years across a year boundary', () => {
    expect(formatWeekRange('2026-12-27', '2027-01-02')).toBe('Dec 27, 2026 – Jan 2, 2027');
  });

  it('shows both month names within a single year', () => {
    expect(formatWeekRange('2026-11-29', '2026-12-05')).toBe('Nov 29 – Dec 5, 2026');
  });
});

describe('isoDate', () => {
  it('zero-pads month and day', () => {
    expect(isoDate(2026, 7, 5)).toBe('2026-07-05');
  });
});
