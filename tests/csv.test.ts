import { parseCsv, applyMapping, normalizeRawEvent } from '../src/shared/import/csv';
import { autoGuessMapping } from '../src/shared/import/mapping';

describe('parseCsv', () => {
  it('parses headers, rows and auto-maps common calendar columns', () => {
    const csv =
      'Subject,Start Date,Start Time,Location\n' +
      "Mom's Birthday,03/15/2020,,Home\n" +
      'Standup,2020-03-16,9:00 AM,Office\n';
    const parsed = parseCsv(csv);
    expect(parsed.headers).toEqual(['Subject', 'Start Date', 'Start Time', 'Location']);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.events).toHaveLength(2);
    expect(parsed.events[0]).toMatchObject({
      subject: "Mom's Birthday",
      start_date: '2020-03-15',
      location: 'Home'
    });
    expect(parsed.events[1]).toMatchObject({ start_time: '09:00' });
  });

  it('returns empty structures for empty content', () => {
    expect(parseCsv('')).toEqual({ events: [], headers: [], rows: [] });
  });
});

describe('autoGuessMapping', () => {
  it('recognizes Google/Outlook header aliases', () => {
    const mapping = autoGuessMapping(['Title', 'Start Date', 'All Day Event', 'Description']);
    expect(mapping['Title']).toBe('subject');
    expect(mapping['Start Date']).toBe('start_date');
    expect(mapping['All Day Event']).toBe('all_day');
    expect(mapping['Description']).toBe('description');
  });
});

describe('applyMapping', () => {
  it('builds events from explicit mapping and skips rows with no subject or date', () => {
    const headers = ['Name', 'When'];
    const rows = [
      ['Party', '2021-01-01'],
      ['', ''],
      ['Solo', '']
    ];
    const events = applyMapping(headers, rows, { Name: 'subject', When: 'start_date' });
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ subject: 'Party', start_date: '2021-01-01' });
    expect(events[1]).toMatchObject({ subject: 'Solo' });
  });
});

describe('normalizeRawEvent', () => {
  it('returns null when neither subject nor start date present', () => {
    expect(normalizeRawEvent({ location: 'Nowhere' })).toBeNull();
  });
  it('normalizes all_day', () => {
    expect(normalizeRawEvent({ subject: 'X', all_day: 'true' })?.all_day).toBe(1);
  });
});
