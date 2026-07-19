import { EventDatabase } from './database';
import {
  NewEvent,
  DuplicateStrategy,
  ImportSummary,
  ImportFormat
} from '../shared/types';
import { buildDuplicateIndex, isDuplicate, dupKey } from '../shared/import/duplicates';

/**
 * Commit parsed events into the database applying the chosen duplicate strategy,
 * and write an import_log entry. Duplicates are matched on subject + start
 * date/time, both against existing rows and within the incoming batch.
 */
export function commitImport(
  db: EventDatabase,
  events: NewEvent[],
  strategy: DuplicateStrategy,
  meta: { filename: string; format: ImportFormat }
): ImportSummary {
  const summary: ImportSummary = {
    imported: 0,
    skipped: 0,
    failed: 0,
    total: events.length,
    errors: []
  };

  const index = buildDuplicateIndex(db.list());

  for (const candidate of events) {
    try {
      if (!candidate.subject && !candidate.start_date) {
        summary.failed++;
        continue;
      }
      if (isDuplicate(candidate, index) && strategy === 'skip') {
        summary.skipped++;
        continue;
      }
      db.create({ ...candidate, source_file: meta.filename });
      index.add(dupKey(candidate));
      summary.imported++;
    } catch (err) {
      summary.failed++;
      summary.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  db.logImport({
    filename: meta.filename,
    format: meta.format,
    records_imported: summary.imported,
    imported_at: new Date().toISOString()
  });

  return summary;
}
