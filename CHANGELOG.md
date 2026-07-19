# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-19

### Added

- **Day and Week views.** In addition to Month, Year, Agenda and Annual
  Recurring, the toolbar now offers a **Day** view (a single date's events in a
  vertical detail list) and a **Week** view (a Sun–Sat grid for the week
  containing the anchor date). The existing `‹` / `›` arrows step by **one day**
  in Day view and **seven days** in Week view (with correct month/year rollover),
  and **Today** re-anchors to the current date in whichever view is active. The
  anchor date reuses the existing selected-date state, defaulting to today when
  none is set. Clicking a day in Week view selects it into the side day-panel,
  exactly like Month/Year view. The month/year dropdowns are hidden for Day/Week
  (the anchor date, not a month+year pair, is the navigation unit), consistent
  with Agenda/Annual Recurring. Native menu accelerators were renumbered to keep
  a natural granularity progression: Day `Ctrl+1`, Week `Ctrl+2`, Month `Ctrl+3`,
  Year `Ctrl+4`, Agenda `Ctrl+5`, Annual Recurring `Ctrl+6`.

### Fixed

- **Annual-recurring detection false positives from recurring meetings.** A
  recurring meeting exported as one row per occurrence (weekly team sync,
  recurring 1:1, etc.) could land on the same month+day in two different years
  purely by chance, causing it to be misdetected as an annual event. Detection
  now runs a second pass: for each subject it counts the distinct month/day
  combinations it appears on across the whole archive (fuzzy variants merged when
  fuzzy matching is enabled), and a subject scattered across two or more distinct
  dates is excluded entirely — every cluster for it is dropped. The distinct-date
  count is computed only from non-`RRULE:FREQ=YEARLY` instances, so a genuinely
  yearly RRULE item is still trusted, while a single stray RRULE instance can no
  longer whitewash an otherwise-clearly-recurring meeting. Genuine once-a-year
  items (birthdays, anniversaries) are unaffected — they only ever occur on one
  date, so they pass the new filter trivially.

## [1.1.0] - 2026-07-19

### Added

- **Meeting Organizer / Required Attendees / Optional Attendees fields.** These
  are now first-class event fields (previously users had to squeeze Outlook's
  organizer/attendee columns into the single Description field). They are:
  - stored as dedicated SQLite columns (existing pre-1.1.0 databases are migrated
    in place — the new columns are added and default to empty; no data loss);
  - offered as real targets ("Meeting Organizer", "Required Attendees", "Optional
    Attendees") in the column-mapping dialog, and auto-detected from common CSV
    headers (`Meeting Organizer`/`Organizer`, `Required Attendees`/`Attendees`,
    `Optional Attendees`) and ICS `ORGANIZER`/`ATTENDEE` (REQ/OPT) properties;
  - round-tripped on CSV export (with the same formula-injection sanitization as
    other text fields) and on ICS export (as `ORGANIZER`/`ATTENDEE` lines);
  - shown as labeled rows in the event detail / day panel (only when populated);
  - included in full-text search, alongside subject/description/location/category.

### Fixed

- **Column-mapping dialog overflow with many columns.** Wide source files (e.g. a
  real Outlook export with ~20 headers) previously pushed mapping rows and the
  Cancel/Continue footer off-screen, making the import impossible to complete.
  The modal now caps its height and scrolls its body internally while the title
  and footer stay fixed and always visible. The fix is in the shared `Modal`
  component, so every dialog benefits and short dialogs are unaffected.

## [1.0.1] - 2026-07-19

### Security

- **CSV / formula-injection hardening:** exported CSV fields (subject,
  description, location, category, source) whose text begins with `=`, `+`, `-`,
  `@`, or a leading tab/carriage-return are now prefixed with a single quote so
  opening an exported archive in Excel/Sheets/LibreOffice can no longer execute
  attacker-supplied formulas (e.g. `=cmd|'/c calc'!A1`). Applies to both the
  full-archive and recurring-items CSV exporters.
- **Electron sandbox enabled:** the main `BrowserWindow` now runs with
  `sandbox: true` (in addition to the existing `contextIsolation: true` /
  `nodeIntegration: false`), tightening the renderer's security boundary.
- **Security test suite added** (does not change runtime behavior beyond the
  fixes above):
  - CSV/formula-injection tests asserting leading formula triggers are
    neutralized on export.
  - XSS / HTML-injection component tests asserting malicious event fields render
    as literal text (React escaping; no `dangerouslySetInnerHTML` anywhere).
  - SQL-injection tests confirming all `better-sqlite3` queries are
    parameterized — classic payloads (`'; DROP TABLE events; --`) are stored and
    compared as inert data and never drop or corrupt the table.
  - Malformed / adversarial ICS tests (unterminated blocks, huge property
    values, absurd `RRULE` counts, control characters, deeply repeated blocks)
    confirming the parser fails gracefully and never hangs or crashes.
  - Path-traversal guards asserting main-process file paths derive only from
    native dialogs / `path.join`, never from untrusted string concatenation.
  - An Electron-hardening regression guard locking in the `webPreferences`
    flags above.
  - A local-only (git-ignored) regression test validating the CSV importer
    against a large, real-world Outlook export (BOM handling, multiline quoted
    fields, missing optional columns).

## [1.0.0] - 2026-07-19

Initial release of Archival Calendar — a read-only Windows desktop viewer for
historic calendar data.

### Added

- **Views:** Month, Year, and Agenda views for browsing archived calendar data,
  plus a dedicated Annual Recurring Events tab.
- **Search:** full-text search across event subject, description, location and
  category.
- **CSV import:** automatic column mapping for common Google and Outlook exports,
  a manual field-mapping dialog for arbitrary CSVs, and flexible date/time
  parsing (ISO, US `M/D/Y`, ICS basic, textual months).
- **ICS import:** dependency-free iCalendar parser supporting line unfolding,
  all-day (`VALUE=DATE`) events, `CATEGORIES`, and `RRULE`.
- **Duplicate handling:** on import, detect duplicates by subject + start
  date/time and either skip them or keep both.
- **Annual recurrence detection:** group events on the same month & day across
  two or more years, or carrying `RRULE:FREQ=YEARLY`, with an optional
  fuzzy-subject matching mode and automatic Birthday/Anniversary categorization.
- **Export:** export the full archive to CSV or ICS, and export detected
  recurring items to CSV or to ICS as yearly-recurring events.
- **Portable database:** single SQLite (`better-sqlite3`) file with New / Open /
  Save As support; default at `Documents\ArchivalCalendar\archive.db`.
- **First-run seeding:** bundled sample events loaded once into a new database.
- **Settings:** light/dark theme and fuzzy-recurring toggle, persisted across
  sessions.
- **Application menu** with keyboard shortcuts for views, navigation, find,
  import/export, and database management.
- **Windows packaging:** NSIS installer and portable zip via electron-builder,
  published automatically on `v*` tags through GitHub Actions.

### Known limitations

- **Outlook PST import is not supported in v1.** The import dialog lists it as a
  disabled "coming soon" option; export from Outlook to CSV or ICS in the
  meantime. Native PST support is planned for a future release.
- The app is a read-only archival viewer: creating, editing single items,
  deleting single items, reminders, and recurring-event scheduling are
  intentionally out of scope.
