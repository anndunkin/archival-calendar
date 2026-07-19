# Archival Calendar

Archival Calendar is a Windows desktop application for browsing and preserving
**historic calendar data**. It is a read-only viewer — not a live scheduler —
built for importing years of exported calendar entries (CSV or ICS), browsing
them by month, year, or agenda, searching across everything, and detecting the
annually-recurring items (birthdays, anniversaries) buried in your history so you
can export them to a single file for whatever reminder tool you use.

Built with Electron, React, TypeScript and SQLite (`better-sqlite3`).

## Features

- **Day, Week, Month, Year, and Agenda views** for browsing decades of calendar
  history. Day and Week views step with the same `‹` / `›` arrows — by one day
  and by seven days respectively — and `Today` re-anchors to the current date.
- **Full-text search** across subject, description, location, category, meeting
  organizer and attendees.
- **CSV import** with an automatic column mapper for common Google and Outlook
  exports, plus a manual field-mapping dialog for anything else. The mapping
  dialog scrolls internally, so wide exports (Outlook's ~20 columns) map cleanly
  with the Cancel/Continue buttons always reachable.
- **ICS import** via a dependency-free iCalendar parser (handles folded lines,
  all-day events, `RRULE`, categories).
- **Duplicate handling** on import (skip duplicates, or keep both) matched on
  subject + start date/time.
- **Annual Recurring Events detection** — groups events landing on the same
  month & day across two or more years, or carrying `RRULE:FREQ=YEARLY`, with an
  optional fuzzy-subject matching mode. Recurring *meetings* are filtered out: if
  the same subject appears on two or more different month/day dates anywhere in
  the archive (a signal it's a regularly-scheduled meeting, not a once-a-year
  occasion), it is excluded even when two of its occurrences coincidentally share
  a date. The distinct-date count ignores explicit `RRULE:FREQ=YEARLY`
  instances, so intentionally-yearly items are still trusted.
- **Export** the whole archive (CSV or ICS) or just the detected recurring items
  (CSV, or ICS as yearly-recurring events) for import into a reminder tool.
- **Portable SQLite database** you can open, create, or "Save As" anywhere.
- **Light and dark themes.**

## Install (end users)

1. Go to the [Releases](https://github.com/anndunkin/archival-calendar/releases)
   page and download the latest **Archival Calendar Setup `<version>`.exe**
   installer (or the portable `.zip`).
2. Run the installer and follow the prompts. You may choose the install location.
3. Launch **Archival Calendar** from the Start Menu or desktop shortcut.

On first launch the app creates a portable database and seeds it with a small set
of sample events so you have something to explore immediately.

## Usage

Use the toolbar to switch views and navigate periods, or the keyboard shortcuts:

| Shortcut  | Action                     |
| --------- | -------------------------- |
| `Ctrl+1`  | Day view                   |
| `Ctrl+2`  | Week view                  |
| `Ctrl+3`  | Month view                 |
| `Ctrl+4`  | Year view                  |
| `Ctrl+5`  | Agenda view                |
| `Ctrl+6`  | Annual Recurring view      |
| `Ctrl+T`  | Jump to today              |
| `Ctrl+F`  | Find (focus search)        |
| `Ctrl+,`  | Settings                   |

Import calendar data from **File → Import**, export from **File → Export
Archive**, and manage the database file (New / Open / Save As) from the **File**
menu.

## Data file location

Archival Calendar stores everything in a single portable SQLite database. By
default it lives at:

```
Documents\ArchivalCalendar\archive.db
```

You can create a new database, open an existing one, or save a copy elsewhere
from the **File** menu (or the **Settings** dialog). The bundled sample events
(`data/sample-events.json`) are loaded **once** into a freshly-created database so
first-run users have data to explore; they are never re-seeded after that.

## Supported import formats

- **CSV** — Google Calendar and Outlook exports are auto-detected; common headers
  (`Subject`/`Title`/`Summary`, `Start Date`, `Start Time`, `All Day Event`,
  `Location`, `Description`, `Category`, `Meeting Organizer`, `Required Attendees`,
  `Optional Attendees`…) are mapped automatically. Any other CSV can be mapped
  manually with the column-mapping dialog. A range of date formats is understood
  (ISO, US `M/D/Y`, textual months).
- **ICS / iCalendar** — standard `.ics` files, including all-day events, folded
  lines, categories, recurrence rules, and `ORGANIZER`/`ATTENDEE` (required vs.
  optional) properties.
- **Outlook PST — _not supported in v1_ (known limitation).** The import dialog
  lists "Outlook PST (coming soon)" as a disabled option. For now, export your
  Outlook calendar to CSV or ICS instead:
  - **CSV:** File → Open & Export → Import/Export → Export to a file → Comma
    Separated Values.
  - **ICS:** drag calendar events to the desktop, or use Save As → iCalendar.

  Native PST support is planned for a future release (likely via `pst-extractor`
  or similar).

## Development

```bash
npm install          # install dependencies
npm run build        # production build (main + renderer)
npm run dev:renderer # renderer dev server with hot reload
npm start            # build main and launch Electron
npm test             # run the Jest test suite
npm run typecheck    # TypeScript type-check (no emit)
npm run dist         # build and package Windows installers
```

## Project structure

```
archival-calendar/
├── assets/                 # app icons (generated by scripts/make-icon.js)
├── data/
│   └── sample-events.json  # bundled first-run sample data
├── scripts/
│   └── make-icon.js        # generates assets/icon.ico + icon.png
├── src/
│   ├── main/               # Electron main process
│   │   ├── database.ts     # SQLite (better-sqlite3) access layer
│   │   ├── seed.ts         # first-run sample seeding
│   │   ├── settings.ts     # persisted app settings
│   │   ├── import-service.ts
│   │   ├── ipc-handlers.ts # IPC handlers
│   │   ├── menu.ts         # application menu
│   │   ├── preload.ts      # contextBridge API
│   │   └── index.ts        # app entry / window creation
│   ├── renderer/           # React UI
│   │   ├── components/      # views + dialogs
│   │   ├── styles/app.css
│   │   ├── calendar.ts     # calendar grid helpers
│   │   └── App.tsx
│   └── shared/             # code shared by main + renderer
│       ├── types.ts
│       ├── dates.ts        # date/time normalization
│       ├── recurrence.ts   # annual-recurrence detection
│       ├── export.ts       # CSV/ICS export
│       └── import/         # CSV, ICS, JSON parsers + mapping + dedupe
├── tests/                  # Jest tests (node + jsdom projects)
├── .github/workflows/release.yml
├── electron-builder.yml
└── package.json
```

## Notes on the build

- The renderer runs with `contextIsolation: true` and `nodeIntegration: false`;
  all privileged operations go through a typed `contextBridge` API defined in
  `src/main/preload.ts`.
- `better-sqlite3` is a **native module**. It is kept external from the webpack
  bundle and rebuilt for Electron by `electron-builder` during packaging. In CI,
  the test runner builds its own binding for the host Node version (see
  `.github/workflows/release.yml`).
- Windows installers (NSIS `.exe` + portable `.zip`) are built on
  `windows-latest` in GitHub Actions and published automatically when a `v*` tag
  is pushed.

## License

MIT — see [LICENSE](LICENSE).
