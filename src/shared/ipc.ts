export const IPC = {
  // events
  EVENTS_LIST: 'events:list',
  EVENT_GET: 'event:get',
  EVENTS_BY_DATE: 'events:byDate',
  EVENTS_CLEAR: 'events:clear',
  // recurring
  RECURRING_LIST: 'recurring:list',
  RECURRING_EXPORT: 'recurring:export',
  // database
  DB_INFO: 'db:info',
  DB_NEW: 'db:new',
  DB_OPEN: 'db:open',
  DB_SAVE_AS: 'db:saveAs',
  // import / export
  IMPORT_PICK: 'import:pick',
  IMPORT_APPLY_MAPPING: 'import:applyMapping',
  IMPORT_COMMIT: 'import:commit',
  IMPORT_LOG: 'import:log',
  EXPORT_ALL: 'export:all',
  // settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  // menu -> renderer events
  MENU_EVENT: 'menu:event',
  // first-launch seeding progress -> renderer
  SEED_PROGRESS: 'seed:progress'
} as const;

export interface SeedProgress {
  phase: 'start' | 'done';
  total: number;
}

export type MenuEvent =
  | 'view-month'
  | 'view-year'
  | 'view-agenda'
  | 'view-recurring'
  | 'find'
  | 'jump-today'
  | 'import-csv'
  | 'import-ics'
  | 'export-all-csv'
  | 'export-all-ics'
  | 'new-db'
  | 'open-db'
  | 'save-as'
  | 'clear-events'
  | 'settings'
  | 'about';
