import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MonthView } from '../src/renderer/components/MonthView';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), id: Math.floor(Math.random() * 1e6), ...patch };
}

describe('MonthView', () => {
  it('renders a 42-cell grid with weekday headers', () => {
    render(
      <MonthView year={2020} month={3} events={[]} selectedDate={null} onSelectDate={() => {}} />
    );
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('shows events on their day and a +N more indicator past three', () => {
    const events = [
      ev({ subject: 'One', start_date: '2020-03-10' }),
      ev({ subject: 'Two', start_date: '2020-03-10' }),
      ev({ subject: 'Three', start_date: '2020-03-10' }),
      ev({ subject: 'Four', start_date: '2020-03-10' })
    ];
    render(
      <MonthView year={2020} month={3} events={events} selectedDate={null} onSelectDate={() => {}} />
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('calls onSelectDate with the ISO date when a cell is clicked', () => {
    const onSelect = jest.fn();
    render(
      <MonthView year={2020} month={3} events={[]} selectedDate={null} onSelectDate={onSelect} />
    );
    fireEvent.click(screen.getByText('15'));
    expect(onSelect).toHaveBeenCalledWith('2020-03-15');
  });
});
