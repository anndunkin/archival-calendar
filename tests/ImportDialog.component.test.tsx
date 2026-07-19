import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportDialog } from '../src/renderer/components/ImportDialog';
import { PickedImport } from '../src/main/preload';
import { ImportSummary } from '../src/shared/types';

const picked: PickedImport = {
  filePath: '/tmp/events.csv',
  filename: 'events.csv',
  format: 'csv',
  events: [{ subject: 'A', start_date: '2020-01-01' }],
  headers: ['Subject', 'Start Date'],
  rows: [['A', '2020-01-01']]
};

describe('ImportDialog', () => {
  const commitImport = jest.fn();

  beforeEach(() => {
    commitImport.mockReset();
    (window as unknown as { archivalCalendar: unknown }).archivalCalendar = { commitImport };
  });

  it('shows the count and duplicate-strategy options', () => {
    render(
      <ImportDialog picked={picked} events={picked.events} onCancel={() => {}} onDone={() => {}} />
    );
    expect(screen.getByText(/Found/)).toBeInTheDocument();
    expect(screen.getByText('Skip duplicates')).toBeInTheDocument();
    expect(screen.getByText('Import anyway (keep both)')).toBeInTheDocument();
  });

  it('commits the import and renders the summary', async () => {
    const summary: ImportSummary = {
      imported: 1,
      skipped: 0,
      failed: 0,
      total: 1,
      errors: []
    };
    commitImport.mockResolvedValue(summary);
    const onDone = jest.fn();

    render(
      <ImportDialog picked={picked} events={picked.events} onCancel={() => {}} onDone={onDone} />
    );
    fireEvent.click(screen.getByText('Import 1 events'));

    await waitFor(() => expect(screen.getByText('Import Complete')).toBeInTheDocument());
    expect(commitImport).toHaveBeenCalledWith(picked.events, 'skip', {
      filename: 'events.csv',
      format: 'csv'
    });

    fireEvent.click(screen.getByText('Done'));
    expect(onDone).toHaveBeenCalledWith(summary);
  });
});
