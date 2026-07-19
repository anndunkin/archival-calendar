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
});
