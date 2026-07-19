import Database from 'better-sqlite3';
import {
  CalendarEvent,
  NewEvent,
  ImportLogEntry,
  RecurringItem,
  emptyEvent
} from '../shared/types';
import { detectRecurringItems } from '../shared/recurrence';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
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
  organizer TEXT DEFAULT '',
  required_attendees TEXT DEFAULT '',
  optional_attendees TEXT DEFAULT '',
  rrule TEXT DEFAULT '',
  source_file TEXT DEFAULT '',
  created_at TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS import_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  format TEXT,
  records_imported INTEGER,
  imported_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_subject ON events(subject);
`;

const COLUMNS: (keyof CalendarEvent)[] = [
  'subject', 'start_date', 'start_time', 'end_date', 'end_time', 'all_day',
  'description', 'location', 'category', 'organizer', 'required_attendees',
  'optional_attendees', 'rrule', 'source_file', 'created_at'
];

/**
 * Columns added after v1.0.1. A pre-existing user database created by an older
 * release will not have these, so we ALTER the table to add any that are
 * missing (SQLite defaults them to '' via the column definition). New/fresh
 * databases already get them from SCHEMA above, so this is a no-op there.
 */
const ADDED_COLUMNS: { name: string; ddl: string }[] = [
  { name: 'organizer', ddl: "organizer TEXT DEFAULT ''" },
  { name: 'required_attendees', ddl: "required_attendees TEXT DEFAULT ''" },
  { name: 'optional_attendees', ddl: "optional_attendees TEXT DEFAULT ''" }
];

export class EventDatabase {
  private db: Database.Database;

  constructor(filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(SCHEMA);
    this.migrate();
  }

  /** Lightweight in-place migration: add post-v1.0.1 columns if absent. */
  private migrate(): void {
    const existing = new Set(
      (this.db.prepare('PRAGMA table_info(events)').all() as { name: string }[]).map((c) => c.name)
    );
    for (const col of ADDED_COLUMNS) {
      if (!existing.has(col.name)) {
        this.db.exec(`ALTER TABLE events ADD COLUMN ${col.ddl}`);
      }
    }
  }

  close(): void {
    this.db.close();
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as n FROM events').get() as { n: number };
    return row.n;
  }

  list(): CalendarEvent[] {
    return this.db
      .prepare('SELECT * FROM events ORDER BY start_date, start_time, subject COLLATE NOCASE')
      .all() as CalendarEvent[];
  }

  get(id: number): CalendarEvent | undefined {
    return this.db.prepare('SELECT * FROM events WHERE id = ?').get(id) as
      | CalendarEvent
      | undefined;
  }

  /** All events on a given ISO date (YYYY-MM-DD). */
  byDate(isoDate: string): CalendarEvent[] {
    return this.db
      .prepare('SELECT * FROM events WHERE start_date = ? ORDER BY start_time, subject COLLATE NOCASE')
      .all(isoDate) as CalendarEvent[];
  }

  create(input: NewEvent): CalendarEvent {
    const event: CalendarEvent = {
      ...emptyEvent(),
      ...input,
      created_at: input.created_at || new Date().toISOString()
    };
    const placeholders = COLUMNS.map(() => '?').join(', ');
    const values = COLUMNS.map((col) => event[col]);
    const result = this.db
      .prepare(`INSERT INTO events (${COLUMNS.join(', ')}) VALUES (${placeholders})`)
      .run(...(values as never[]));
    return this.get(Number(result.lastInsertRowid))!;
  }

  /** Bulk-insert within a single transaction. Returns created events. */
  bulkCreate(inputs: NewEvent[]): CalendarEvent[] {
    const created: CalendarEvent[] = [];
    const txn = this.db.transaction((items: NewEvent[]) => {
      for (const item of items) created.push(this.create(item));
    });
    txn(inputs);
    return created;
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM events WHERE id = ?').run(id).changes > 0;
  }

  /** Bulk data-management affordance: wipe all events (not per-item editing). */
  clearAll(): number {
    const n = this.count();
    this.db.prepare('DELETE FROM events').run();
    return n;
  }

  /** Delete all events imported from a specific source file (bad-batch fix). */
  deleteBySource(sourceFile: string): number {
    return this.db.prepare('DELETE FROM events WHERE source_file = ?').run(sourceFile).changes;
  }

  recurringItems(fuzzy: boolean): RecurringItem[] {
    return detectRecurringItems(this.list(), { fuzzy });
  }

  logImport(entry: Omit<ImportLogEntry, 'id'>): void {
    this.db
      .prepare('INSERT INTO import_log (filename, format, records_imported, imported_at) VALUES (?, ?, ?, ?)')
      .run(entry.filename, entry.format, entry.records_imported, entry.imported_at);
  }

  importLog(): ImportLogEntry[] {
    return this.db.prepare('SELECT * FROM import_log ORDER BY imported_at DESC').all() as ImportLogEntry[];
  }
}
