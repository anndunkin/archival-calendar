import React from 'react';
import { CalendarEvent } from '../../shared/types';
import { formatLongDate } from '../calendar';

interface AgendaViewProps {
  events: CalendarEvent[];
  selectedId: number | null;
  onSelect: (event: CalendarEvent) => void;
}

/** Chronological list of events — the best view for search results. */
export function AgendaView({ events, selectedId, onSelect }: AgendaViewProps): React.JSX.Element {
  if (events.length === 0) {
    return <p className="empty">No events match.</p>;
  }
  return (
    <div className="agenda-view">
      {events.map((e) => (
        <div
          key={e.id}
          className={`agenda-row ${e.id === selectedId ? 'selected' : ''}`}
          onClick={() => onSelect(e)}
        >
          <div className="agenda-date">
            <div className="agenda-date-main">{formatLongDate(e.start_date)}</div>
            <div className="agenda-date-time muted">
              {e.all_day ? 'All day' : e.start_time || ''}
            </div>
          </div>
          <div className="agenda-body">
            <div className="agenda-subject">{e.subject || '(no subject)'}</div>
            <div className="muted agenda-meta">
              {[e.location, e.category].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
