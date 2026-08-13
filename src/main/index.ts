import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { EventDatabase } from './database';
import { buildMenu, setWindowTitle } from './menu';
import { getSettings, setDatabasePath } from './settings';
import { registerIpcHandlers, getCurrentDb } from './ipc-handlers';
import { loadSeedEvents } from './seed';
import { IPC, SeedProgress } from '../shared/ipc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

/**
 * Resolve the bundled sample seed file in both dev and packaged contexts. Gives
 * a brand-new database a small starter dataset on first launch; users import
 * their own calendar exports via File → Import.
 */
function sampleSeedPath(): string {
  const candidates = [
    path.join(process.resourcesPath || '', 'data', 'sample-events.json'),
    path.join(app.getAppPath(), 'data', 'sample-events.json'),
    path.join(__dirname, '..', '..', 'data', 'sample-events.json')
  ];
  return candidates.find((p) => fs.existsSync(p)) || candidates[candidates.length - 1];
}

/** Documents/ArchivalCalendar is where the portable .db lives. */
function documentsDir(): string {
  const dir = path.join(app.getPath('documents'), 'ArchivalCalendar');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sendSeedProgress(progress: SeedProgress): void {
  mainWindow?.webContents.send(IPC.SEED_PROGRESS, progress);
}

/**
 * Seed a brand-new database from the bundled sample file. Runs only once: if the
 * database already has events, this is a no-op so a user's archive is never
 * overwritten on subsequent launches.
 */
function seedDatabase(db: EventDatabase): void {
  if (db.count() > 0) return;
  const seed = sampleSeedPath();
  if (!fs.existsSync(seed)) return;
  try {
    const events = loadSeedEvents(seed);
    if (!events.length) return;
    sendSeedProgress({ phase: 'start', total: events.length });
    db.bulkCreate(events);
    sendSeedProgress({ phase: 'done', total: events.length });
  } catch {
    /* ignore malformed seed */
  }
}

export function openDatabaseAt(filePath: string): void {
  const current = getCurrentDb();
  if (current.db) current.db.close();
  const db = new EventDatabase(filePath);
  seedDatabase(db);
  current.db = db;
  current.path = filePath;
  setDatabasePath(filePath);
  if (mainWindow) setWindowTitle(mainWindow, path.basename(filePath));
}

async function firstLaunchFlow(): Promise<void> {
  const settings = getSettings();

  if (settings.databasePath && fs.existsSync(settings.databasePath)) {
    openDatabaseAt(settings.databasePath);
    return;
  }

  if (!mainWindow) return;
  const choice = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Create New Database', 'Open Existing…'],
    defaultId: 0,
    cancelId: 0,
    title: 'Welcome to Archival Calendar',
    message: 'No archive database is configured.',
    detail:
      'Create a new database (pre-loaded with bundled sample events) or open an existing .db file.'
  });

  if (choice.response === 1) {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Archive Database',
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
      properties: ['openFile']
    });
    if (!result.canceled && result.filePaths[0]) {
      openDatabaseAt(result.filePaths[0]);
      return;
    }
  }

  // Default: create new in Documents/ArchivalCalendar.
  const defaultPath = path.join(documentsDir(), 'archive.db');
  openDatabaseAt(defaultPath);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 620,
    title: 'Archival Calendar',
    webPreferences: {
      // preload must stay CommonJS (.js) — Electron's sandboxed preload
      // (sandbox: true below) cannot load an ES module preload script.
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  buildMenu(mainWindow);
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.webContents.on('did-finish-load', () => {
    void firstLaunchFlow();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers(
    () => mainWindow,
    (filePath) => openDatabaseAt(filePath),
    documentsDir
  );
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  const current = getCurrentDb();
  if (current.db) current.db.close();
  if (process.platform !== 'darwin') app.quit();
});
