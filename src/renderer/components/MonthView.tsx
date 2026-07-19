import React, { useMemo } from 'react';
import { CalendarEvent } from '../../shared/types';
import { monthGrid, WEEKDAYS, todayIso } from '../calendar';

interface MonthViewProps {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function MonthView({
  year,
  month,
  events,
  selectedDate,
  onSelectDate
}: MonthViewProps): JSX.Element {
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      if (!e.start_date) continue;
      (map.get(e.start_date) ?? map.set(e.start_date, []).get(e.start_date)!).push(e);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => monthGrid(year, month), [year, month]);
  const today = todayIso();

  return (
    <div className="month-view">
      <div className="month-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekday">
            {w}
          </div>
        ))}
      </div>
      <div className="month-grid" role="grid">
        {cells.map((cell) => {
          const dayEvents = byDate.get(cell.date) ?? [];
          const classes = [
            'day-cell',
            cell.inMonth ? '' : 'out-month',
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
                {dayEvents.slice(0, 3).map((e) => (
                  <div key={e.id} className="day-event" title={e.subject}>
                    {e.subject || '(no subject)'}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="day-event more">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
