import React from 'react';
import { CalendarEvent } from '../../shared/types';
import { formatLongDate } from '../calendar';
import { EventDetail } from './EventDetail';

interface DayPanelProps {
  date: string | null;
  events: CalendarEvent[];
}

/** Side panel showing all events on the selected day (read-only). */
export function DayPanel({ date, events }: DayPanelProps): JSX.Element {
  if (!date) {
    return (
      <aside className="day-panel">
        <p className="empty">Select a day to see its events.</p>
      </aside>
    );
  }
  return (
    <aside className="day-panel">
      <h3 className="day-panel-title">{formatLongDate(date)}</h3>
      {events.length === 0 ? (
        <p className="empty">No events on this day.</p>
      ) : (
        events.map((e) => <EventDetail key={e.id} event={e} />)
      )}
    </aside>
  );
}
