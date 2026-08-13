import React, { useState } from 'react';
import { DuplicateStrategy, ImportSummary, NewEvent } from '../../shared/types';
import { PickedImport } from '../../main/preload';
import { Modal } from './Modal';

interface ImportDialogProps {
  picked: PickedImport;
  events: NewEvent[];
  onCancel: () => void;
  onDone: (summary: ImportSummary) => void;
}

export function ImportDialog({ picked, events, onCancel, onDone }: ImportDialogProps): React.JSX.Element {
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const runImport = async () => {
    setBusy(true);
    const result = await window.archivalCalendar.commitImport(events, strategy, {
      filename: picked.filename,
      format: picked.format
    });
    setSummary(result);
    setBusy(false);
  };

  if (summary) {
    return (
      <Modal
        title="Import Complete"
        onClose={() => onDone(summary)}
        footer={
          <button className="primary" onClick={() => onDone(summary)}>
            Done
          </button>
        }
      >
        <div>
          <span className="summary-stat">
            <b>{summary.imported}</b> imported
          </span>
          <span className="summary-stat">
            <b>{summary.skipped}</b> skipped (duplicates)
          </span>
          <span className="summary-stat">
            <b>{summary.failed}</b> failed to parse
          </span>
          <span className="summary-stat">
            <b>{summary.total}</b> total
          </span>
        </div>
        {summary.errors.length > 0 && (
          <div style={{ marginTop: 12, color: 'var(--danger)' }}>
            {summary.errors.length} error(s): {summary.errors.slice(0, 3).join('; ')}
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      title={`Import from ${picked.filename}`}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={runImport}
            disabled={busy || events.length === 0}
          >
            {busy ? 'Importing…' : `Import ${events.length} events`}
          </button>
        </>
      }
    >
      <p>
        Found <strong>{events.length}</strong> events in a{' '}
        <strong>{picked.format.toUpperCase()}</strong> file.
      </p>
      <p className="muted">When a duplicate is detected (same subject + start date/time):</p>
      <div className="radio-group">
        {(['skip', 'create'] as DuplicateStrategy[]).map((s) => (
          <label key={s}>
            <input
              type="radio"
              name="strategy"
              style={{ width: 'auto', marginRight: 8 }}
              checked={strategy === s}
              onChange={() => setStrategy(s)}
            />
            {s === 'skip' && 'Skip duplicates'}
            {s === 'create' && 'Import anyway (keep both)'}
          </label>
        ))}
      </div>
    </Modal>
  );
}
