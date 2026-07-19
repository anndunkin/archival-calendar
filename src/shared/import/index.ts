import { ImportFormat, ParsedImport } from '../types';
import { parseCsv } from './csv';
import { parseIcs } from './ics';

export * from './csv';
export * from './ics';
export * from './json';
export * from './mapping';
export * from './duplicates';

export function detectFormat(filePath: string): ImportFormat {
  const ext = filePath.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'ics':
    case 'ical':
    case 'ifb':
      return 'ics';
    default:
      return 'csv';
  }
}

export function parseByFormat(format: ImportFormat, content: string): ParsedImport {
  switch (format) {
    case 'csv':
      return parseCsv(content);
    case 'ics':
      return parseIcs(content);
    default:
      throw new Error(`Unsupported import format: ${format}`);
  }
}
