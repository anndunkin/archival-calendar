import React, { useMemo } from 'react';
import { CalendarEvent } from '../../shared/types';
import { WEEKDAYS, weekDates, todayIso } from '../calendar';

interface WeekViewProps {
  anchor: string; // any ISO date within the week to show
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

/** Sun–Sat grid for the week containing the anchor date. */
export function WeekView({
  anchor,
  events,
  selectedDate,
  onSelectDate
}: WeekViewProps): JSX.Element {
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!e.start_date) continue;
      (map.get(e.start_date) ?? map.set(e.start_date, []).get(e.start_date)!).push(e);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => weekDates(anchor), [anchor]);
  const today = todayIso();

  return (
    <div className="week-view">
      <div className="month-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="week-grid" role="grid">
        {cells.map((cell) => {
          const dayEvents = byDate.get(cell.date) ?? [];
          const classes = [
            'day-cell',
            cell.date === selectedDate ? 'selected' : '',
            cell.date === today ? 'today' : ''
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={cell.date}
              role="gridcell"
              className={classes}
              onClick={() => onSelectDate(cell.date)}
            >
              <div className="day-number">{cell.day}</div>
              <div className="day-events">
                {dayEvents.slice(0, 4).map((e) => (
                  <div key={e.id} className="day-event" title={e.subject}>
                    {e.subject || '(no subject)'}
                  </div>
                ))}
                {dayEvents.length > 4 && (
                  <div className="day-event more">+{dayEvents.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
