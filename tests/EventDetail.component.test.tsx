import React from 'react';
import { render, screen } from '@testing-library/react';
import { EventDetail } from '../src/renderer/components/EventDetail';
import { DayPanel } from '../src/renderer/components/DayPanel';
import { CalendarEvent, emptyEvent } from '../src/shared/types';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), id: 1, ...patch };
}

describe('EventDetail organizer/attendee rows', () => {
  it('renders Organizer / Required / Optional rows when populated', () => {
    render(
      <EventDetail
        event={ev({
          subject: 'Sync',
          start_date: '2020-01-01',
          organizer: 'Jane Smith',
          required_attendees: 'John Doe',
          optional_attendees: 'Sam Lee'
        })}
      />
    );
    expect(screen.getByText('Organizer')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.getByText('Sam Lee')).toBeInTheDocument();
  });

  it('omits organizer/attendee rows entirely when the fields are empty', () => {
    render(<EventDetail event={ev({ subject: 'Plain', start_date: '2020-01-01' })} />);
    expect(screen.queryByText('Organizer')).toBeNull();
    expect(screen.queryByText('Required')).toBeNull();
    expect(screen.queryByText('Optional')).toBeNull();
  });

  it('renders only the populated subset (organizer only)', () => {
    render(
      <EventDetail
        event={ev({ subject: 'Solo', start_date: '2020-01-01', organizer: 'Jane Smith' })}
      />
    );
    expect(screen.getByText('Organizer')).toBeInTheDocument();
    expect(screen.queryByText('Required')).toBeNull();
    expect(screen.queryByText('Optional')).toBeNull();
  });
});

describe('DayPanel surfaces organizer/attendees for the day', () => {
  it('shows attendee info for events on the selected day', () => {
    render(
      <DayPanel
        date="2020-01-01"
        events={[
          ev({
            subject: 'Sync',
            start_date: '2020-01-01',
            organizer: 'Jane Smith',
            required_attendees: 'John Doe'
          })
        ]}
      />
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
