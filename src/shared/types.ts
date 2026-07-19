export interface CalendarEvent {
  id?: number;
  subject: string;
  start_date: string; // ISO date: YYYY-MM-DD
  start_time: string; // HH:MM (24h) or ''
  end_date: string; // YYYY-MM-DD or ''
  end_time: string; // HH:MM or ''
  all_day: number; // 0 | 1
  description: string;
  location: string;
  category: string;
  rrule: string; // raw RRULE from ICS (e.g. FREQ=YEARLY) or ''
  source_file: string; // filename this event was imported from
  created_at: string;
}

export type NewEvent = Partial<CalendarEvent>;

export interface ImportLogEntry {
  id?: number;
  filename: string;
  format: string;
  records_imported: number;
  imported_at: string;
}

export type ImportFormat = 'csv' | 'ics';

export type DuplicateStrategy = 'skip' | 'create';

export interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  total: number;
  errors: string[];
}

export interface ParsedImport {
  events: NewEvent[];
  /** For CSV: the raw header row so the renderer can offer a field-mapping dialog. */
  headers?: string[];
  /** For CSV: raw rows of values aligned to headers, used after mapping. */
  rows?: string[][];
}

/** Maps a source column name to a CalendarEvent field key. */
export type FieldMapping = Record<string, keyof CalendarEvent | ''>;

export type RecurringCategory = 'Birthday' | 'Anniversary' | 'Other';

export interface RecurringItem {
  /** Stable key derived from normalized subject + month/day. */
  key: string;
  subject: string;
  month: number; // 1-12
  day: number; // 1-31
  years: number[]; // distinct years, ascending
  count: number; // number of source event instances
  category: RecurringCategory;
  /** 'rrule' = FREQ=YEARLY present in source; 'inferred' = detected by month/day repetition. */
  source: 'rrule' | 'inferred';
}

export interface AppSettings {
  databasePath: string | null;
  theme: 'light' | 'dark';
  /** When true, cluster similar (not just identical) subjects when detecting annual items. */
  fuzzyRecurring: boolean;
}

export const EVENT_FIELDS: (keyof CalendarEvent)[] = [
  'subject',
  'start_date',
  'start_time',
  'end_date',
  'end_time',
  'all_day',
  'description',
  'location',
  'category',
  'rrule',
  'source_file'
];

/** Fields offered as targets in the CSV column-mapping dialog, with labels. */
export const MAPPABLE_FIELDS: { key: keyof CalendarEvent; label: string }[] = [
  { key: 'subject', label: 'Subject / Title' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_date', label: 'End Date' },
  { key: 'end_time', label: 'End Time' },
  { key: 'all_day', label: 'All Day Event' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' }
];

export function emptyEvent(): CalendarEvent {
  return {
    subject: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    all_day: 0,
    description: '',
    location: '',
    category: '',
    rrule: '',
    source_file: '',
    created_at: new Date().toISOString()
  };
}
