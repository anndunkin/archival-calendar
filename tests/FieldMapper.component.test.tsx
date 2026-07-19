import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { FieldMapper } from '../src/renderer/components/FieldMapper';
import { autoGuessMapping } from '../src/shared/import/mapping';

// A realistic ~20-column Outlook export header set.
const OUTLOOK_HEADERS = [
  'Subject',
  'Start Date',
  'Start Time',
  'End Date',
  'End Time',
  'All Day Event',
  'Reminder On/Off',
  'Reminder Date',
  'Reminder Time',
  'Meeting Organizer',
  'Required Attendees',
  'Optional Attendees',
  'Meeting Resources',
  'Billing Information',
  'Categories',
  'Description',
  'Location',
  'Mileage',
  'Priority',
  'Private',
  'Sensitivity',
  'Show time as'
];

describe('FieldMapper with a large Outlook header set', () => {
  it('renders a mapping row for every header including the last one', () => {
    const { container } = render(
      <FieldMapper
        headers={OUTLOOK_HEADERS}
        initialMapping={autoGuessMapping(OUTLOOK_HEADERS)}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    // Query the row labels specifically (header names also appear as dropdown
    // option labels, so a plain getByText would match multiple nodes).
    const rowLabels = Array.from(container.querySelectorAll('.mapper-row strong')).map(
      (el) => el.textContent
    );
    expect(rowLabels).toEqual(OUTLOOK_HEADERS);
    // One <select> per header row.
    expect(screen.getAllByRole('combobox')).toHaveLength(OUTLOOK_HEADERS.length);
  });

  it('keeps the Cancel/Continue footer buttons rendered (always visible outside scroll)', () => {
    render(
      <FieldMapper
        headers={OUTLOOK_HEADERS}
        initialMapping={{}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('offers the new Meeting Organizer / Required / Optional Attendees options in every row', () => {
    render(
      <FieldMapper
        headers={OUTLOOK_HEADERS}
        initialMapping={{}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const selects = screen.getAllByRole('combobox');
    for (const select of selects) {
      const options = within(select).getAllByRole('option').map((o) => o.textContent);
      expect(options).toContain('Meeting Organizer');
      expect(options).toContain('Required Attendees');
      expect(options).toContain('Optional Attendees');
    }
  });

  it('auto-selects the organizer/attendee fields for their matching headers', () => {
    render(
      <FieldMapper
        headers={OUTLOOK_HEADERS}
        initialMapping={autoGuessMapping(OUTLOOK_HEADERS)}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const idx = OUTLOOK_HEADERS.indexOf('Meeting Organizer');
    expect(selects[idx].value).toBe('organizer');
    expect(selects[OUTLOOK_HEADERS.indexOf('Required Attendees')].value).toBe('required_attendees');
    expect(selects[OUTLOOK_HEADERS.indexOf('Optional Attendees')].value).toBe('optional_attendees');
  });

  it('wraps modal content in a scrollable body with a fixed footer', () => {
    const { container } = render(
      <FieldMapper
        headers={OUTLOOK_HEADERS}
        initialMapping={{}}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    // Structural guarantee that the fix is in place: scrollable body + footer.
    expect(container.querySelector('.modal-body')).not.toBeNull();
    expect(container.querySelector('.modal-footer')).not.toBeNull();
    const body = container.querySelector('.modal-body')!;
    // The mapping rows live inside the scrollable body, not the fixed footer.
    expect(body.querySelectorAll('.mapper-row').length).toBe(OUTLOOK_HEADERS.length);
  });
});
