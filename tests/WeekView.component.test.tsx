import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekView } from '../src/renderer/components/WeekView';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), id: Math.floor(Math.random() * 1e6), ...patch };
}

describe('WeekView', () => {
  it('renders 7 day cells with weekday headers', () => {
    render(
      <WeekView anchor="2026-07-21" events={[]} selectedDate={null} onSelectDate={() => {}} />
    );
    expect(screen.getAllByRole('gridcell')).toHaveLength(7);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders the correct day numbers for the anchor week (Sun–Sat)', () => {
    render(
      <WeekView anchor="2026-07-21" events={[]} selectedDate={null} onSelectDate={() => {}} />
    );
    // Week of 2026-07-21 runs 19..25.
    for (const day of [19, 20, 21, 22, 23, 24, 25]) {
      expect(screen.getByText(String(day))).toBeInTheDocument();
    }
  });

  it('renders a week that spans a month/year boundary', () => {
    // Week containing 2026-12-31 runs Dec 27 .. Jan 2.
    render(
      <WeekView anchor="2026-12-31" events={[]} selectedDate={null} onSelectDate={() => {}} />
    );
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(7);
    // First cell is Dec 27, last cell is Jan 2.
    expect(cells[0]).toHaveTextContent('27');
    expect(cells[6]).toHaveTextContent('2');
  });

  it('shows a day\'s events and calls onSelectDate when a cell is clicked', () => {
    const onSelect = jest.fn();
    const events = [ev({ subject: 'Team sync', start_date: '2026-07-22' })];
    render(
      <WeekView
        anchor="2026-07-21"
        events={events}
        selectedDate={null}
        onSelectDate={onSelect}
      />
    );
    expect(screen.getByText('Team sync')).toBeInTheDocument();
    fireEvent.click(screen.getByText('22'));
    expect(onSelect).toHaveBeenCalledWith('2026-07-22');
  });
});
