# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
