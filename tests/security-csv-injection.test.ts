import {
  exportEventsCsv,
  exportRecurringCsv,
  sanitizeCsvField
} from '../src/shared/export';
import { CalendarEvent, RecurringItem, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), ...patch };
}

/**
 * CSV / formula injection: an imported event field whose text begins with
 * = + - @ (or a leading tab/CR) is treated as a formula by Excel/Sheets/
 * LibreOffice. Exported archives must neutralize these so opening the file
 * cannot execute an attacker-supplied formula.
 */
describe('sanitizeCsvField', () => {
  it.each(['=1+1', '+1', '-1', '@SUM(1+1)', "=cmd|'/c calc'!A1", '=HYPERLINK("http://evil")'])(
    'prefixes a leading formula trigger with a quote: %s',
    (payload) => {
      const out = sanitizeCsvField(payload);
      expect(out.startsWith("'")).toBe(true);
      expect(out).toBe(`'${payload}`);
    }
  );

  it('neutralizes leading tab and carriage-return triggers', () => {
    expect(sanitizeCsvField('\t=evil')).toBe("'\t=evil");
    expect(sanitizeCsvField('\r=evil')).toBe("'\r=evil");
  });

  it('leaves benign values untouched', () => {
    expect(sanitizeCsvField('Birthday party')).toBe('Birthday party');
    expect(sanitizeCsvField('2020-01-01')).toBe('2020-01-01');
    expect(sanitizeCsvField('a=b')).toBe('a=b'); // trigger only matters at position 0
    expect(sanitizeCsvField('')).toBe('');
    expect(sanitizeCsvField(null)).toBe('');
    expect(sanitizeCsvField(undefined)).toBe('');
  });
});

describe('exportEventsCsv formula-injection hardening', () => {
  it('neutralizes formula payloads in every text field on export', () => {
    const csv = exportEventsCsv([
      ev({
        subject: '=cmd|\'/c calc\'!A1',
        start_date: '2020-01-01',
        location: '+HYPERLINK("http://evil")',
        description: '-2+3',
        category: '@SUM(1+1)'
      })
    ]);
    // Neutralized forms are present...
    expect(csv).toContain("'=cmd");
    expect(csv).toContain("'+HYPERLINK");
    expect(csv).toContain("'-2+3");
    expect(csv).toContain("'@SUM(1+1)");
    // ...and no data cell begins a formula. Parse each field back and check.
    const lines = csv.split(/\r?\n/).filter(Boolean);
    for (const line of lines.slice(1)) {
      // naive field split is fine here: our payloads contain no bare commas
      for (const rawCell of line.split(',')) {
        const cell = rawCell.replace(/^"|"$/g, '');
        if (cell.length > 0) {
          expect(/^[=+\-@\t\r]/.test(cell)).toBe(false);
        }
      }
    }
  });
});

describe('exportRecurringCsv formula-injection hardening', () => {
  it('neutralizes a formula payload in a recurring item subject/category', () => {
    const item: RecurringItem = {
      key: 'x|1|1',
      subject: '=2+5',
      month: 1,
      day: 1,
      years: [2020],
      count: 1,
      // category is normally an enum; cast to exercise the sanitizer defensively
      category: '@evil' as RecurringItem['category'],
      source: 'inferred'
    };
    const csv = exportRecurringCsv([item]);
    expect(csv).toContain("'=2+5");
    expect(csv).toContain("'@evil");
  });
});
