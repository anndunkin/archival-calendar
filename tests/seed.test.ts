import * as path from 'path';
import { loadSeedEvents } from '../src/main/seed';
import { detectRecurringItems } from '../src/shared/recurrence';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

const SEED_PATH = path.join(__dirname, '..', 'data', 'sample-events.json');

describe('loadSeedEvents', () => {
  const events = loadSeedEvents(SEED_PATH);

  it('loads a batch of sample events tagged with the source file', () => {
    expect(events.length).toBeGreaterThanOrEqual(15);
    for (const e of events) {
      expect(e.source_file).toBe('sample-events.json');
      expect(e.subject).toBeTruthy();
      expect(e.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('contains at least two annually-recurring items across multiple years', () => {
    const full: CalendarEvent[] = events.map((e) => ({ ...emptyEvent(), ...e }));
    const items = detectRecurringItems(full);
    expect(items.length).toBeGreaterThanOrEqual(2);
    const multiYear = items.filter((i) => i.years.length >= 2);
    expect(multiYear.length).toBeGreaterThanOrEqual(2);
  });
});
