import { app, Menu, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { IPC, MenuEvent } from '../shared/ipc';

function send(win: BrowserWindow, event: MenuEvent): void {
  win.webContents.send(IPC.MENU_EVENT, event);
}

export function buildMenu(win: BrowserWindow): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New Database…', accelerator: 'CmdOrCtrl+N', click: () => send(win, 'new-db') },
        { label: 'Open Database…', accelerator: 'CmdOrCtrl+O', click: () => send(win, 'open-db') },
        { label: 'Save As…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send(win, 'save-as') },
        { type: 'separator' },
        {
          label: 'Import',
          submenu: [
            { label: 'CSV…', click: () => send(win, 'import-csv') },
            { label: 'iCalendar (.ics)…', click: () => send(win, 'import-ics') },
            { label: 'Outlook PST (coming soon)', enabled: false, click: () => {} }
          ]
        },
        {
          label: 'Export Archive',
          submenu: [
            { label: 'All Events → CSV…', click: () => send(win, 'export-all-csv') },
            { label: 'All Events → ICS…', click: () => send(win, 'export-all-ics') }
          ]
        },
        { type: 'separator' },
        { label: 'Clear All Events…', click: () => send(win, 'clear-events') },
        { type: 'separator' },
        { label: 'Exit', role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Month', accelerator: 'CmdOrCtrl+1', click: () => send(win, 'view-month') },
        { label: 'Year', accelerator: 'CmdOrCtrl+2', click: () => send(win, 'view-year') },
        { label: 'Agenda / List', accelerator: 'CmdOrCtrl+3', click: () => send(win, 'view-agenda') },
        { label: 'Annual Recurring Events', accelerator: 'CmdOrCtrl+4', click: () => send(win, 'view-recurring') },
        { type: 'separator' },
        { label: 'Jump to Today', accelerator: 'CmdOrCtrl+T', click: () => send(win, 'jump-today') },
        { label: 'Find / Search', accelerator: 'CmdOrCtrl+F', click: () => send(win, 'find') },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'CmdOrCtrl+,', click: () => send(win, 'settings') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [{ label: 'About Archival Calendar', click: () => send(win, 'about') }]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
}

export function setWindowTitle(win: BrowserWindow, filename: string | null): void {
  win.setTitle(filename ? `Archival Calendar — ${filename}` : 'Archival Calendar');
}

void app;
