import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSettings,
  CalendarEvent,
  ImportSummary,
  NewEvent,
  FieldMapping,
  RecurringItem
} from '../shared/types';
import { MenuEvent } from '../shared/ipc';
import { PickedImport } from '../main/preload';
import { SearchBar } from './components/SearchBar';
import { MonthView } from './components/MonthView';
import { YearView } from './components/YearView';
import { AgendaView } from './components/AgendaView';
import { DayPanel } from './components/DayPanel';
import { RecurringEvents } from './components/RecurringEvents';
import { ImportDialog } from './components/ImportDialog';
import { FieldMapper } from './components/FieldMapper';
import { SettingsDialog } from './components/SettingsDialog';
import { Modal } from './components/Modal';
import { MONTH_NAMES, todayIso } from './calendar';

type ViewMode = 'month' | 'year' | 'agenda' | 'recurring';

const YEARS_BACK = 60;

export function App(): JSX.Element {
  const now = new Date();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [recurring, setRecurring] = useState<RecurringItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dbInfo, setDbInfo] = useState<{ path: string | null; filename: string | null }>({
    path: null,
    filename: null
  });

  const [view, setView] = useState<ViewMode>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const [picked, setPicked] = useState<PickedImport | null>(null);
  const [mappingEvents, setMappingEvents] = useState<NewEvent[] | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null);
  const [seeding, setSeeding] = useState<{ total: number } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const [list, info, rec] = await Promise.all([
      window.archivalCalendar.listEvents(),
      window.archivalCalendar.dbInfo(),
      window.archivalCalendar.listRecurring()
    ]);
    setEvents(list);
    setDbInfo({ path: info.path, filename: info.filename });
    setRecurring(rec);
  }, []);

  const loadSettings = useCallback(async () => {
    const s = await window.archivalCalendar.getSettings();
    setSettings(s);
    document.documentElement.setAttribute('data-theme', s.theme);
  }, []);

  useEffect(() => {
    void loadSettings();
    const id = setInterval(() => void refresh(), 1500);
    void refresh();
    return () => clearInterval(id);
  }, [refresh, loadSettings]);

  const notify = (title: string, body: string) => setMessage({ title, body });

  const dayEvents = useMemo(
    () => (selectedDate ? events.filter((e) => e.start_date === selectedDate) : []),
    [events, selectedDate]
  );

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [e.subject, e.description, e.location, e.category]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [events, search]);

  const handleImportPick = useCallback(async (format: PickedImport['format']) => {
    const result = await window.archivalCalendar.pickImport(format);
    if (!result) return;
    setPicked(result);
    if (format === 'csv' && result.headers && result.headers.length) {
      setShowMapper(true);
    } else {
      setMappingEvents(result.events);
    }
  }, []);

  const handleMapperConfirm = useCallback(
    async (mapping: FieldMapping) => {
      if (!picked) return;
      const built = await window.archivalCalendar.applyMappingPreview(
        picked.headers ?? [],
        picked.rows ?? [],
        mapping
      );
      setShowMapper(false);
      setMappingEvents(built);
    },
    [picked]
  );

  const handleExportAll = useCallback(async (format: 'csv' | 'ics') => {
    const result = await window.archivalCalendar.exportAll(format);
    if (result.path) notify('Export Complete', `Saved archive to ${result.path}`);
  }, []);

  const handleExportRecurring = useCallback(async (format: 'csv' | 'ics') => {
    const result = await window.archivalCalendar.exportRecurring(format);
    if (result.path) notify('Export Complete', `Saved recurring events to ${result.path}`);
  }, []);

  const jumpToToday = useCallback(() => {
    const t = todayIso();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDate(t);
    setView('month');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMenu = useCallback(
    async (event: MenuEvent) => {
      switch (event) {
        case 'view-month':
          setView('month');
          break;
        case 'view-year':
          setView('year');
          break;
        case 'view-agenda':
          setView('agenda');
          break;
        case 'view-recurring':
          setView('recurring');
          break;
        case 'find':
          setView('agenda');
          setTimeout(() => searchRef.current?.focus(), 0);
          break;
        case 'jump-today':
          jumpToToday();
          break;
        case 'import-csv':
          await handleImportPick('csv');
          break;
        case 'import-ics':
          await handleImportPick('ics');
          break;
        case 'export-all-csv':
          await handleExportAll('csv');
          break;
        case 'export-all-ics':
          await handleExportAll('ics');
          break;
        case 'new-db':
          await window.archivalCalendar.newDatabase();
          void refresh();
          break;
        case 'open-db':
          await window.archivalCalendar.openDatabase();
          void refresh();
          break;
        case 'save-as':
          await window.archivalCalendar.saveDatabaseAs();
          void refresh();
          break;
        case 'clear-events':
          if (confirm('Delete ALL events from this archive database? This cannot be undone.')) {
            const n = await window.archivalCalendar.clearEvents();
            notify('Archive Cleared', `Removed ${n} event(s).`);
            void refresh();
          }
          break;
        case 'settings':
          setShowSettings(true);
          break;
        case 'about':
          notify(
            'About Archival Calendar',
            'Archival Calendar v1.0.0 — Electron + React + SQLite. A read-only viewer for historic calendar data with CSV/ICS import and annual-recurring-event detection.'
          );
          break;
      }
    },
    [handleImportPick, handleExportAll, jumpToToday, refresh]
  );

  useEffect(() => {
    const off = window.archivalCalendar.onMenuEvent((evt) => void handleMenu(evt));
    return off;
  }, [handleMenu]);

  useEffect(() => {
    const off = window.archivalCalendar.onSeedProgress((progress) => {
      if (progress.phase === 'start') setSeeding({ total: progress.total });
      else {
        setSeeding(null);
        void refresh();
      }
    });
    return off;
  }, [refresh]);

  const prevPeriod = () => {
    if (view === 'year') {
      setYear((y) => y - 1);
    } else if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextPeriod = () => {
    if (view === 'year') {
      setYear((y) => y + 1);
    } else if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    const arr: number[] = [];
    for (let y = current + 2; y >= current - YEARS_BACK; y--) arr.push(y);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedEventId(null);
  };

  return (
    <div className="app">
      {seeding && (
        <div className="seed-splash">
          <div className="spinner" />
          <h2>Setting up your archive…</h2>
          <p className="muted">
            Adding {seeding.total.toLocaleString()} sample events. This only happens once.
          </p>
        </div>
      )}

      <div className="toolbar">
        <div className="view-switcher">
          {(['month', 'year', 'agenda', 'recurring'] as ViewMode[]).map((v) => (
            <button
              key={v}
              className={view === v ? 'active' : ''}
              onClick={() => setView(v)}
            >
              {v === 'recurring' ? 'Annual Recurring' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {view !== 'recurring' && view !== 'agenda' && (
          <div className="nav-controls">
            <button onClick={prevPeriod} aria-label="Previous">
              ‹
            </button>
            <button onClick={jumpToToday}>Today</button>
            <button onClick={nextPeriod} aria-label="Next">
              ›
            </button>
            {view === 'month' && (
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            )}
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {(view === 'agenda' || view === 'recurring') && (
          <span className="period-label">
            {view === 'agenda' ? 'Agenda' : 'Annual Recurring Events'}
          </span>
        )}

        <div className="spacer" />

        {view === 'agenda' && (
          <SearchBar value={search} onChange={setSearch} inputRef={searchRef} />
        )}
        <span className="muted">
          {dbInfo.filename ? `${dbInfo.filename} · ` : ''}
          {events.length} events
        </span>
        <button onClick={() => setShowSettings(true)}>Settings</button>
      </div>

      <div className="main">
        {view === 'month' && (
          <>
            <div className="calendar-area">
              <h2 className="period-title">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
              <MonthView
                year={year}
                month={month}
                events={events}
                selectedDate={selectedDate}
                onSelectDate={selectDate}
              />
            </div>
            <DayPanel date={selectedDate} events={dayEvents} />
          </>
        )}

        {view === 'year' && (
          <div className="calendar-area">
            <h2 className="period-title">{year}</h2>
            <YearView
              year={year}
              events={events}
              onSelectMonth={(m) => {
                setMonth(m);
                setView('month');
              }}
              onSelectDate={(date) => {
                selectDate(date);
                const p = date.match(/^(\d{4})-(\d{2})/);
                if (p) {
                  setYear(Number(p[1]));
                  setMonth(Number(p[2]));
                }
                setView('month');
              }}
            />
          </div>
        )}

        {view === 'agenda' && (
          <div className="calendar-area agenda-area">
            <AgendaView
              events={searchResults}
              selectedId={selectedEventId}
              onSelect={(e) => setSelectedEventId(e.id ?? null)}
            />
          </div>
        )}

        {view === 'recurring' && (
          <div className="calendar-area">
            <RecurringEvents items={recurring} onExport={handleExportRecurring} />
          </div>
        )}
      </div>

      {showMapper && picked && (
        <FieldMapper
          headers={picked.headers ?? []}
          initialMapping={{}}
          onConfirm={handleMapperConfirm}
          onCancel={() => {
            setShowMapper(false);
            setPicked(null);
          }}
        />
      )}

      {mappingEvents && picked && (
        <ImportDialog
          picked={picked}
          events={mappingEvents}
          onCancel={() => {
            setMappingEvents(null);
            setPicked(null);
          }}
          onDone={(summary: ImportSummary) => {
            setMappingEvents(null);
            setPicked(null);
            void refresh();
            notify(
              'Import Complete',
              `${summary.imported} imported, ${summary.skipped} skipped, ${summary.failed} failed.`
            );
          }}
        />
      )}

      {showSettings && settings && (
        <SettingsDialog
          settings={settings}
          dbPath={dbInfo.path}
          onChooseDatabase={async () => {
            await window.archivalCalendar.openDatabase();
            void refresh();
          }}
          onSave={async (patch) => {
            const updated = await window.archivalCalendar.setSettings(patch);
            setSettings(updated);
            document.documentElement.setAttribute('data-theme', updated.theme);
            setShowSettings(false);
            void refresh();
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {message && (
        <Modal
          title={message.title}
          onClose={() => setMessage(null)}
          footer={
            <button className="primary" onClick={() => setMessage(null)}>
              OK
            </button>
          }
        >
          <p style={{ whiteSpace: 'pre-wrap' }}>{message.body}</p>
        </Modal>
      )}
    </div>
  );
}
