import React, { useState } from 'react';
import { MAPPABLE_FIELDS, CalendarEvent, FieldMapping } from '../../shared/types';
import { Modal } from './Modal';

interface FieldMapperProps {
  headers: string[];
  initialMapping: FieldMapping;
  onConfirm: (mapping: FieldMapping) => void;
  onCancel: () => void;
}

export function FieldMapper({
  headers,
  initialMapping,
  onConfirm,
  onCancel
}: FieldMapperProps): React.JSX.Element {
  const base: FieldMapping = {};
  for (const h of headers) base[h] = '';
  const [mapping, setMapping] = useState<FieldMapping>({ ...base, ...initialMapping });

  return (
    <Modal
      title="Map Columns to Event Fields"
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={() => onConfirm(mapping)}>
            Continue
          </button>
        </>
      }
    >
      <p className="muted">
        Choose which event field each source column maps to. Unmapped columns are ignored. Common
        Google and Outlook headers are matched automatically.
      </p>
      {headers.map((header) => (
        <div className="mapper-row" key={header}>
          <div>
            <strong>{header}</strong>
          </div>
          <select
            value={mapping[header] ?? ''}
            onChange={(e) =>
              setMapping((prev) => ({
                ...prev,
                [header]: e.target.value as keyof CalendarEvent | ''
              }))
            }
          >
            <option value="">— Ignore —</option>
            {MAPPABLE_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </Modal>
  );
}
