import { dupKey, buildDuplicateIndex, isDuplicate } from '../src/shared/import/duplicates';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), ...patch };
}

describe('duplicates', () => {
  it('builds a key from subject + start date + start time, case-insensitively', () => {
    expect(dupKey(ev({ subject: 'Lunch', start_date: '2020-01-01', start_time: '12:00' }))).toBe(
      dupKey(ev({ subject: 'LUNCH', start_date: '2020-01-01', start_time: '12:00' }))
    );
  });

  it('detects duplicates against an index', () => {
    const existing = [ev({ subject: 'Party', start_date: '2020-05-05', start_time: '' })];
    const index = buildDuplicateIndex(existing);
    expect(isDuplicate(ev({ subject: 'Party', start_date: '2020-05-05' }), index)).toBe(true);
    expect(isDuplicate(ev({ subject: 'Party', start_date: '2020-05-06' }), index)).toBe(false);
    expect(isDuplicate(ev({ subject: 'Other', start_date: '2020-05-05' }), index)).toBe(false);
  });
});
