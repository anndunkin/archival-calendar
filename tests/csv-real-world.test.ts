import * as fs from 'fs';
import * as path from 'path';
import { parseCsv } from '../src/shared/import/csv';

/**
 * Local-only regression test against a large, real-world Outlook CSV export.
 *
 * The fixture contains real personal data and is git-ignored (see .gitignore:
 * tests/fixtures/real-world/), so it will NOT exist in CI or on other machines.
 * The suite skips gracefully when the file is absent — this is a developer
 * regression guard, not a CI-required test.
 */
const FIXTURE = path.join(__dirname, 'fixtures', 'real-world', 'OutlookCalendar-1.CSV');
const hasFixture = fs.existsSync(FIXTURE);

const describeOrSkip = hasFixture ? describe : describe.skip;

describeOrSkip('parseCsv — real-world Outlook export', () => {
  let content: string;
  let parsed: ReturnType<typeof parseCsv>;

  beforeAll(() => {
    content = fs.readFileSync(FIXTURE, 'utf-8');
    parsed = parseCsv(content);
  });

  it('parses without throwing and returns a structured result', () => {
    expect(parsed).toBeDefined();
    expect(Array.isArray(parsed.events)).toBe(true);
    expect(Array.isArray(parsed.rows)).toBe(true);
  });

  it('handles the leading UTF-8 BOM so the first header is "Subject"', () => {
    // The file starts with EF BB BF; the parser must not leave a BOM glued to
    // the first header (which would break auto-mapping of the Subject column).
    expect(parsed.headers![0]).toBe('Subject');
    expect(parsed.headers).toContain('Start Date');
  });

  it('extracts a sane number of events (not zero, not obviously wrong)', () => {
    // The raw file is ~254k lines but that includes embedded newlines inside
    // quoted fields, so the logical event count is far lower. Assert it is a
    // believable, positive number and never exceeds the raw line count.
    const rawLineCount = content.split('\n').length;
    expect(parsed.events.length).toBeGreaterThan(50);
    expect(parsed.events.length).toBeLessThan(rawLineCount);
  });

  it('correctly reassembles multiline quoted fields with embedded newlines', () => {
    // If embedded newlines were mishandled, papaparse would emit far more rows
    // than there are logical records. Row count should be well under the raw
    // physical line count, proving multiline fields were joined into one row.
    const rawLineCount = content.split('\n').length;
    expect(parsed.rows!.length).toBeLessThan(rawLineCount / 2);
    expect(parsed.rows!.length).toBeGreaterThan(0);
  });

  it('auto-maps the standard Outlook columns to event fields', () => {
    const withSubject = parsed.events.filter((e) => e.subject);
    const withDate = parsed.events.filter((e) => e.start_date);
    expect(withSubject.length).toBeGreaterThan(0);
    expect(withDate.length).toBeGreaterThan(0);
  });

  it('does not choke on rows with missing optional columns', () => {
    // Many real rows leave Location/Description/Categories blank. Every produced
    // event must still be a well-formed object with at least subject or date.
    for (const e of parsed.events) {
      expect(typeof e).toBe('object');
      expect(Boolean(e.subject) || Boolean(e.start_date)).toBe(true);
    }
  });
});
