import React, { useState } from 'react';
import { AppSettings } from '../../shared/types';
import { Modal } from './Modal';

interface SettingsDialogProps {
  settings: AppSettings;
  dbPath: string | null;
  onSave: (patch: Partial<AppSettings>) => void;
  onCancel: () => void;
  onChooseDatabase: () => void;
}

export function SettingsDialog({
  settings,
  dbPath,
  onSave,
  onCancel,
  onChooseDatabase
}: SettingsDialogProps): React.JSX.Element {
  const [theme, setTheme] = useState(settings.theme);
  const [fuzzyRecurring, setFuzzyRecurring] = useState(settings.fuzzyRecurring);

  return (
    <Modal
      title="Settings"
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onSave({ theme, fuzzyRecurring })}>
            Save
          </button>
        </>
      }
    >
      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>Database File</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={dbPath ?? '(none)'} readOnly />
          <button onClick={onChooseDatabase} style={{ whiteSpace: 'nowrap' }}>
            Open…
          </button>
        </div>
      </div>

      <div className="form-field" style={{ marginBottom: 16 }}>
        <label>Theme</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div className="form-field">
        <label>
          <input
            type="checkbox"
            style={{ width: 'auto', marginRight: 8 }}
            checked={fuzzyRecurring}
            onChange={(e) => setFuzzyRecurring(e.target.checked)}
          />
          Fuzzy match subjects when detecting annual recurring events
        </label>
        <p className="muted" style={{ marginTop: 4 }}>
          When off, only events with identical subjects are grouped. When on, similar subjects
          (e.g. “Mom's Birthday” vs “Moms bday”) are grouped together.
        </p>
      </div>
    </Modal>
  );
}
