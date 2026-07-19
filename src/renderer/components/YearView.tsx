import React, { useMemo } from 'react';
import { CalendarEvent } from '../../shared/types';
import { monthGrid, MONTH_NAMES } from '../calendar';

interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onSelectMonth: (month: number) => void;
  onSelectDate: (date: string) => void;
}

/** 12 mini-months for scanning a whole year of the archive at once. */
export function YearView({ year, events, onSelectMonth, onSelectDate }: YearViewProps): JSX.Element {
  const datesWithEvents = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) if (e.start_date) set.add(e.start_date);
    return set;
  }, [events]);

  return (
    <div className="year-view">
      {MONTH_NAMES.map((name, idx) => {
        const month = idx + 1;
        const cells = monthGrid(year, month);
        return (
          <div key={name} className="mini-month">
            <div className="mini-month-title" onClick={() => onSelectMonth(month)}>
              {name}
            </div>
            <div className="mini-grid">
              {cells.map((cell) => {
                const has = cell.inMonth && datesWithEvents.has(cell.date);
                const classes = [
                  'mini-cell',
                  cell.inMonth ? '' : 'out',
                  has ? 'has-events' : ''
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <div
                    key={cell.date}
                    className={classes}
                    onClick={() => cell.inMonth && onSelectDate(cell.date)}
                  >
                    {cell.inMonth ? cell.day : ''}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
