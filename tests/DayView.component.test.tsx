import React from 'react';
import { render, screen } from '@testing-library/react';
import { DayView } from '../src/renderer/components/DayView';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), id: Math.floor(Math.random() * 1e6), ...patch };
}

describe('DayView', () => {
  it('renders only the events on the given date', () => {
    const events = [
      ev({ subject: 'Morning standup', start_date: '2026-07-21' }),
      ev({ subject: 'Lunch with Sam', start_date: '2026-07-21' }),
      ev({ subject: 'Other day event', start_date: '2026-07-22' })
    ];
    render(<DayView date="2026-07-21" events={events} />);
    expect(screen.getByText('Morning standup')).toBeInTheDocument();
    expect(screen.getByText('Lunch with Sam')).toBeInTheDocument();
    expect(screen.queryByText('Other day event')).not.toBeInTheDocument();
  });

  it('shows an empty state when the day has no events', () => {
    render(<DayView date="2026-07-21" events={[]} />);
    expect(screen.getByText('No events on this day.')).toBeInTheDocument();
  });
});
