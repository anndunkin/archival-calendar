import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { EventDatabase } from './database';
import { IPC } from '../shared/ipc';
import { NewEvent, DuplicateStrategy, ImportFormat, FieldMapping } from '../shared/types';
import { detectFormat, parseByFormat, applyMapping } from '../shared/import';
import { commitImport } from './import-service';
import {
  exportEventsCsv,
  exportEventsIcs,
  exportRecurringCsv,
  exportRecurringIcs
} from '../shared/export';
import { getSettings, setSettings } from './settings';

interface DbHolder {
  db: EventDatabase | null;
  path: string | null;
}

const holder: DbHolder = { db: null, path: null };

export function getCurrentDb(): DbHolder {
  return holder;
}

function requireDb(): EventDatabase {
  if (!holder.db) throw new Error('No database is open.');
  return holder.db;
}

const IMPORT_FILTERS: Record<ImportFormat, Electron.FileFilter[]> = {
  csv: [{ name: 'CSV', extensions: ['csv'] }],
  ics: [{ name: 'iCalendar', extensions: ['ics', 'ical', 'ifb'] }]
};

export function registerIpcHandlers(
  getWindow: () => BrowserWindow | null,
  openDatabaseAt: (filePath: string) => void,
  documentsDir: () => string
): void {
  // --- events ---
  ipcMain.handle(IPC.EVENTS_LIST, () => requireDb().list());
  ipcMain.handle(IPC.EVENT_GET, (_e, id: number) => requireDb().get(id));
  ipcMain.handle(IPC.EVENTS_BY_DATE, (_e, isoDate: string) => requireDb().byDate(isoDate));
  ipcMain.handle(IPC.EVENTS_CLEAR, () => requireDb().clearAll());

  // --- recurring ---
  ipcMain.handle(IPC.RECURRING_LIST, () =>
    requireDb().recurringItems(getSettings().fuzzyRecurring)
  );
  ipcMain.handle(IPC.RECURRING_EXPORT, async (_e, format: 'csv' | 'ics') => {
    const win = getWindow();
    if (!win) return { path: null };
    const result = await dialog.showSaveDialog(win, {
      title: `Export Annual Recurring Events (${format.toUpperCase()})`,
      defaultPath: path.join(documentsDir(), `recurring-events.${format}`),
      filters: [{ name: format.toUpperCase(), extensions: [format] }]
    });
    if (result.canceled || !result.filePath) return { path: null };
    const items = requireDb().recurringItems(getSettings().fuzzyRecurring);
    const content = format === 'csv' ? exportRecurringCsv(items) : exportRecurringIcs(items);
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { path: result.filePath };
  });

  // --- database ---
  ipcMain.handle(IPC.DB_INFO, () => ({
    path: holder.path,
    filename: holder.path ? path.basename(holder.path) : null,
    count: holder.db ? holder.db.count() : 0
  }));

  ipcMain.handle(IPC.DB_NEW, async () => {
    const win = getWindow();
    if (!win) return { path: null };
    const result = await dialog.showSaveDialog(win, {
      title: 'Create New Database',
      defaultPath: path.join(documentsDir(), 'archive.db'),
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });
    if (result.canceled || !result.filePath) return { path: null };
    if (fs.existsSync(result.filePath)) fs.unlinkSync(result.filePath);
    openDatabaseAt(result.filePath);
    return { path: result.filePath };
  });

  ipcMain.handle(IPC.DB_OPEN, async () => {
    const win = getWindow();
    if (!win) return { path: null };
    const result = await dialog.showOpenDialog(win, {
      title: 'Open Database',
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths[0]) return { path: null };
    openDatabaseAt(result.filePaths[0]);
    return { path: result.filePaths[0] };
  });

  ipcMain.handle(IPC.DB_SAVE_AS, async () => {
    const win = getWindow();
    if (!win || !holder.path) return { path: null };
    const result = await dialog.showSaveDialog(win, {
      title: 'Save Database As',
      defaultPath: path.join(documentsDir(), 'archive-copy.db'),
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    });
    if (result.canceled || !result.filePath) return { path: null };
    fs.copyFileSync(holder.path, result.filePath);
    openDatabaseAt(result.filePath);
    return { path: result.filePath };
  });

  // --- import ---
  ipcMain.handle(IPC.IMPORT_PICK, async (_e, format: ImportFormat) => {
    const win = getWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      title: `Import ${format.toUpperCase()}`,
      filters: IMPORT_FILTERS[format],
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    const detected = format ?? detectFormat(filePath);
    const parsed = parseByFormat(detected, fs.readFileSync(filePath, 'utf-8'));
    return {
      ...parsed,
      filePath,
      filename: path.basename(filePath),
      format: detected
    };
  });

  ipcMain.handle(
    IPC.IMPORT_APPLY_MAPPING,
    (_e, headers: string[], rows: string[][], mapping: FieldMapping) =>
      applyMapping(headers, rows, mapping)
  );

  ipcMain.handle(
    IPC.IMPORT_COMMIT,
    (
      _e,
      events: NewEvent[],
      strategy: DuplicateStrategy,
      meta: { filename: string; format: ImportFormat }
    ) => commitImport(requireDb(), events, strategy, meta)
  );

  ipcMain.handle(IPC.IMPORT_LOG, () => requireDb().importLog());

  // --- export whole archive ---
  ipcMain.handle(IPC.EXPORT_ALL, async (_e, format: 'csv' | 'ics') => {
    const win = getWindow();
    if (!win) return { path: null };
    const result = await dialog.showSaveDialog(win, {
      title: `Export Archive (${format.toUpperCase()})`,
      defaultPath: path.join(documentsDir(), `archive-export.${format}`),
      filters: [{ name: format.toUpperCase(), extensions: [format] }]
    });
    if (result.canceled || !result.filePath) return { path: null };
    const events = requireDb().list();
    const content = format === 'csv' ? exportEventsCsv(events) : exportEventsIcs(events);
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { path: result.filePath };
  });

  // --- settings ---
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings());
  ipcMain.handle(IPC.SETTINGS_SET, (_e, patch) => setSettings(patch));
}
