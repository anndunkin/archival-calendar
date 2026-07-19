import { EventDatabase } from '../src/main/database';

/**
 * SQL injection: better-sqlite3 is used with parameterized statements (`?`
 * placeholders) throughout database.ts. These tests feed classic SQLi payloads
 * as user-controlled values (subject, source file, id/date lookups) and assert
 * the payloads are stored/compared as literal data — the schema survives and
 * queries keep working.
 */
describe('EventDatabase SQL-injection resistance', () => {
  let db: EventDatabase;

  beforeEach(() => {
    db = new EventDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('treats a DROP TABLE payload in a subject as literal text', () => {
    const payload = "'; DROP TABLE events; --";
    const created = db.create({ subject: payload, start_date: '2020-01-01' });

    // The events table must still exist and hold the row verbatim.
    expect(db.count()).toBe(1);
    expect(db.get(created.id!)?.subject).toBe(payload);

    // A subsequent insert/query proves the table was not dropped.
    db.create({ subject: 'still here', start_date: '2020-01-02' });
    expect(db.count()).toBe(2);
    expect(db.list().map((e) => e.subject)).toContain(payload);
  });

  it('handles SQLi payloads in a date lookup without breaking', () => {
    db.create({ subject: 'real', start_date: '2020-05-05' });
    const rows = db.byDate("2020-05-05' OR '1'='1");
    // Parameter binding means the malicious OR is compared literally and matches
    // nothing, rather than returning every row.
    expect(rows).toEqual([]);
    expect(db.count()).toBe(1);
  });

  it('handles SQLi payloads in deleteBySource without dropping data', () => {
    db.create({ subject: 'keep', start_date: '2020-01-01', source_file: 'a.csv' });
    const removed = db.deleteBySource("a.csv'; DROP TABLE events; --");
    expect(removed).toBe(0); // literal comparison matches no source_file
    expect(db.count()).toBe(1); // table intact, row intact
    expect(db.list()[0].subject).toBe('keep');
  });

  it('survives a bulk import full of injection payloads and stays queryable', () => {
    db.bulkCreate([
      { subject: "Robert'); DROP TABLE events;--", start_date: '2021-01-01' },
      { subject: '" OR 1=1 --', start_date: '2021-01-02' },
      { subject: 'UNION SELECT * FROM sqlite_master', start_date: '2021-01-03' }
    ]);
    expect(db.count()).toBe(3);
    expect(db.byDate('2021-01-02')).toHaveLength(1);
  });
});
