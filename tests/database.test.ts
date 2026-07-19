import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import Database from 'better-sqlite3';
import { EventDatabase } from '../src/main/database';

describe('EventDatabase', () => {
  let db: EventDatabase;

  beforeEach(() => {
    db = new EventDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  it('starts empty', () => {
    expect(db.count()).toBe(0);
    expect(db.list()).toEqual([]);
  });

  it('creates and retrieves events', () => {
    const created = db.create({ subject: 'Party', start_date: '2020-01-01' });
    expect(created.id).toBeGreaterThan(0);
    expect(created.subject).toBe('Party');
    expect(db.count()).toBe(1);
    expect(db.get(created.id!)?.subject).toBe('Party');
  });

  it('bulk-creates in a transaction and queries by date', () => {
    db.bulkCreate([
      { subject: 'A', start_date: '2020-02-02' },
      { subject: 'B', start_date: '2020-02-02' },
      { subject: 'C', start_date: '2020-03-03' }
    ]);
    expect(db.count()).toBe(3);
    expect(db.byDate('2020-02-02')).toHaveLength(2);
  });

  it('lists events ordered by start date', () => {
    db.create({ subject: 'Later', start_date: '2020-06-01' });
    db.create({ subject: 'Earlier', start_date: '2020-01-01' });
    expect(db.list().map((e) => e.subject)).toEqual(['Earlier', 'Later']);
  });

  it('deletes single and clears all', () => {
    const a = db.create({ subject: 'A', start_date: '2020-01-01' });
    db.create({ subject: 'B', start_date: '2020-01-02' });
    expect(db.delete(a.id!)).toBe(true);
    expect(db.count()).toBe(1);
    expect(db.clearAll()).toBe(1);
    expect(db.count()).toBe(0);
  });

  it('detects recurring items from stored events', () => {
    db.bulkCreate([
      { subject: 'Picnic', start_date: '2019-04-01' },
      { subject: 'Picnic', start_date: '2020-04-01' }
    ]);
    const items = db.recurringItems(false);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ month: 4, day: 1 });
  });

  it('records import log entries', () => {
    db.logImport({
      filename: 'a.csv',
      format: 'csv',
      records_imported: 5,
      imported_at: new Date().toISOString()
    });
    const log = db.importLog();
    expect(log).toHaveLength(1);
    expect(log[0].records_imported).toBe(5);
  });

  it('stores and retrieves organizer/attendee fields on a fresh schema', () => {
    const created = db.create({
      subject: 'Sync',
      start_date: '2020-01-01',
      organizer: 'Jane Smith',
      required_attendees: 'Jane Smith; John Doe',
      optional_attendees: 'Sam Lee'
    });
    const fetched = db.get(created.id!)!;
    expect(fetched.organizer).toBe('Jane Smith');
    expect(fetched.required_attendees).toBe('Jane Smith; John Doe');
    expect(fetched.optional_attendees).toBe('Sam Lee');
  });
});

describe('EventDatabase migration of a pre-v1.0.1 database', () => {
  let file: string;

  beforeEach(() => {
    file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'arch-cal-')), 'old.db');
    // Recreate an OLD schema (no organizer/attendee columns) and seed a row.
    const raw = new Database(file);
    raw.exec(`
      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT DEFAULT '',
        start_date TEXT DEFAULT '',
        start_time TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        end_time TEXT DEFAULT '',
        all_day INTEGER DEFAULT 0,
        description TEXT DEFAULT '',
        location TEXT DEFAULT '',
        category TEXT DEFAULT '',
        rrule TEXT DEFAULT '',
        source_file TEXT DEFAULT '',
        created_at TEXT DEFAULT ''
      );
    `);
    raw.prepare("INSERT INTO events (subject, start_date) VALUES ('Legacy', '2019-05-05')").run();
    raw.close();
  });

  afterEach(() => {
    try {
      fs.rmSync(path.dirname(file), { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('adds the new columns (defaulting to empty) without dropping existing rows', () => {
    const db = new EventDatabase(file);
    const info = (db as unknown as { db: Database.Database }).db
      .prepare('PRAGMA table_info(events)')
      .all() as { name: string }[];
    const cols = new Set(info.map((c) => c.name));
    expect(cols.has('organizer')).toBe(true);
    expect(cols.has('required_attendees')).toBe(true);
    expect(cols.has('optional_attendees')).toBe(true);

    const rows = db.list();
    expect(rows).toHaveLength(1);
    expect(rows[0].subject).toBe('Legacy');
    expect(rows[0].organizer).toBe('');
    expect(rows[0].required_attendees).toBe('');
    expect(rows[0].optional_attendees).toBe('');

    // Existing DB now accepts writes to the new columns.
    const created = db.create({
      subject: 'New',
      start_date: '2021-01-01',
      organizer: 'Jane Smith'
    });
    expect(db.get(created.id!)!.organizer).toBe('Jane Smith');
    db.close();
  });
});
