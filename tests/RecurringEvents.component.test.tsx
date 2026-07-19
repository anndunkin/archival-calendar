import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurringEvents } from '../src/renderer/components/RecurringEvents';
import { RecurringItem } from '../src/shared/types';

const items: RecurringItem[] = [
  {
    key: 'mom|3|15',
    subject: "Mom's Birthday",
    month: 3,
    day: 15,
    years: [2019, 2020, 2021],
    count: 3,
    category: 'Birthday',
    source: 'inferred'
  }
];

describe('RecurringEvents', () => {
  it('shows an empty state when there are no items', () => {
    render(<RecurringEvents items={[]} onExport={() => {}} />);
    expect(screen.getByText(/No annually-recurring items/i)).toBeInTheDocument();
  });

  it('renders detected items in a table', () => {
    render(<RecurringEvents items={items} onExport={() => {}} />);
    expect(screen.getByText("Mom's Birthday")).toBeInTheDocument();
    expect(screen.getByText('March 15')).toBeInTheDocument();
    expect(screen.getByText('inferred')).toBeInTheDocument();
  });

  it('invokes onExport with the chosen format', () => {
    const onExport = jest.fn();
    render(<RecurringEvents items={items} onExport={onExport} />);
    fireEvent.click(screen.getByText('Export CSV'));
    expect(onExport).toHaveBeenCalledWith('csv');
    fireEvent.click(screen.getByText('Export ICS'));
    expect(onExport).toHaveBeenCalledWith('ics');
  });
});
