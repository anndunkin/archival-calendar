import React, { useMemo } from 'react';
import { CalendarEvent } from '../../shared/types';
import { EventDetail } from './EventDetail';

interface DayViewProps {
  date: string;
  events: CalendarEvent[];
}

/** Vertical agenda-style list of a single day's events (read-only). */
export function DayView({ date, events }: DayViewProps): JSX.Element {
  const dayEvents = useMemo(
    () => events.filter((e) => e.start_date === date),
    [events, date]
  );

  return (
    <div className="day-view">
      {dayEvents.length === 0 ? (
        <p className="empty">No events on this day.</p>
      ) : (
        dayEvents.map((e) => <EventDetail key={e.id} event={e} />)
      )}
    </div>
  );
}
