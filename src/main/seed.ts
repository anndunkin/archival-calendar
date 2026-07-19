import * as fs from 'fs';
import { NewEvent } from '../shared/types';
import { normalizeJsonRecord } from '../shared/import/json';

/** Read and normalize a seed JSON file into event-shaped records. */
export function loadSeedEvents(filePath: string): NewEvent[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((r) => normalizeJsonRecord(r as Record<string, unknown>))
    .filter((e): e is NewEvent => e !== null)
    .map((e) => ({ ...e, source_file: 'sample-events.json' }));
}
