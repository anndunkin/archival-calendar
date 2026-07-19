import { contextBridge, ipcRenderer } from 'electron';
import { IPC, MenuEvent, SeedProgress } from '../shared/ipc';
import {
  CalendarEvent,
  AppSettings,
  DuplicateStrategy,
  ImportFormat,
  ImportSummary,
  ParsedImport,
  FieldMapping,
  ImportLogEntry,
  NewEvent,
  RecurringItem
} from '../shared/types';

export interface PickedImport extends ParsedImport {
  filePath: string;
  filename: string;
  format: ImportFormat;
}

const api = {
  // events
  listEvents: (): Promise<CalendarEvent[]> => ipcRenderer.invoke(IPC.EVENTS_LIST),
  getEvent: (id: number): Promise<CalendarEvent | undefined> =>
    ipcRenderer.invoke(IPC.EVENT_GET, id),
  eventsByDate: (isoDate: string): Promise<CalendarEvent[]> =>
    ipcRenderer.invoke(IPC.EVENTS_BY_DATE, isoDate),
  clearEvents: (): Promise<number> => ipcRenderer.invoke(IPC.EVENTS_CLEAR),

  // recurring
  listRecurring: (): Promise<RecurringItem[]> => ipcRenderer.invoke(IPC.RECURRING_LIST),
  exportRecurring: (format: 'csv' | 'ics'): Promise<{ path: string | null }> =>
    ipcRenderer.invoke(IPC.RECURRING_EXPORT, format),

  // database
  dbInfo: (): Promise<{ path: string | null; filename: string | null; count: number }> =>
    ipcRenderer.invoke(IPC.DB_INFO),
  newDatabase: (): Promise<{ path: string | null }> => ipcRenderer.invoke(IPC.DB_NEW),
  openDatabase: (): Promise<{ path: string | null }> => ipcRenderer.invoke(IPC.DB_OPEN),
  saveDatabaseAs: (): Promise<{ path: string | null }> => ipcRenderer.invoke(IPC.DB_SAVE_AS),

  // import / export
  pickImport: (format: ImportFormat): Promise<PickedImport | null> =>
    ipcRenderer.invoke(IPC.IMPORT_PICK, format),
  applyMappingPreview: (
    headers: string[],
    rows: string[][],
    mapping: FieldMapping
  ): Promise<NewEvent[]> =>
    ipcRenderer.invoke(IPC.IMPORT_APPLY_MAPPING, headers, rows, mapping),
  commitImport: (
    events: NewEvent[],
    strategy: DuplicateStrategy,
    meta: { filename: string; format: ImportFormat }
  ): Promise<ImportSummary> =>
    ipcRenderer.invoke(IPC.IMPORT_COMMIT, events, strategy, meta),
  importLog: (): Promise<ImportLogEntry[]> => ipcRenderer.invoke(IPC.IMPORT_LOG),
  exportAll: (format: 'csv' | 'ics'): Promise<{ path: string | null }> =>
    ipcRenderer.invoke(IPC.EXPORT_ALL, format),

  // settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
  setSettings: (patch: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.SETTINGS_SET, patch),

  // menu + seed events
  onMenuEvent: (handler: (event: MenuEvent) => void): (() => void) => {
    const listener = (_e: unknown, evt: MenuEvent) => handler(evt);
    ipcRenderer.on(IPC.MENU_EVENT, listener);
    return () => ipcRenderer.removeListener(IPC.MENU_EVENT, listener);
  },
  onSeedProgress: (handler: (progress: SeedProgress) => void): (() => void) => {
    const listener = (_e: unknown, progress: SeedProgress) => handler(progress);
    ipcRenderer.on(IPC.SEED_PROGRESS, listener);
    return () => ipcRenderer.removeListener(IPC.SEED_PROGRESS, listener);
  }
};

export type ArchivalCalendarApi = typeof api;

contextBridge.exposeInMainWorld('archivalCalendar', api);
