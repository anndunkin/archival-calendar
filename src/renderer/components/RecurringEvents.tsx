import React, { useState } from 'react';
import { RecurringItem, RecurringCategory } from '../../shared/types';
import { monthDayLabel } from '../calendar';

interface RecurringEventsProps {
  items: RecurringItem[];
  onExport: (format: 'csv' | 'ics') => void;
}

const CATEGORIES: RecurringCategory[] = ['Birthday', 'Anniversary', 'Other'];

/**
 * The Annual Recurring Events tab. Lists each detected item once with the
 * month/day, the years it appeared, and an editable category label. The Export
 * button writes all items to a single CSV or ICS file — the deliverable of this
 * feature (the app itself never sends reminders).
 */
export function RecurringEvents({ items, onExport }: RecurringEventsProps): React.JSX.Element {
  const [overrides, setOverrides] = useState<Record<string, RecurringCategory>>({});

  return (
    <div className="recurring-tab">
      <div className="recurring-header">
        <div>
          <h2 style={{ margin: 0 }}>Annual Recurring Events</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Items detected on the same month &amp; day across two or more years, or with a yearly
            recurrence rule. Export them to a single file for your reminder tool.
          </p>
        </div>
        <div className="recurring-actions">
          <button onClick={() => onExport('csv')} disabled={items.length === 0}>
            Export CSV
          </button>
          <button
            className="primary"
            onClick={() => onExport('ics')}
            disabled={items.length === 0}
          >
            Export ICS
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty">
          No annually-recurring items detected yet. Import a few years of calendar data, or enable
          fuzzy matching in Settings.
        </p>
      ) : (
        <table className="recurring-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Years</th>
              <th>Occurrences</th>
              <th>Detected via</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.key}>
                <td className="recurring-subject">{item.subject}</td>
                <td>{monthDayLabel(item.month, item.day)}</td>
                <td>
                  <span title={item.years.join(', ')}>
                    {item.years.length} yr{item.years.length === 1 ? '' : 's'} ({item.years[0]}–
                    {item.years[item.years.length - 1]})
                  </span>
                </td>
                <td>{item.count}</td>
                <td>
                  <span className={`src-badge src-${item.source}`}>
                    {item.source === 'rrule' ? 'RRULE' : 'inferred'}
                  </span>
                </td>
                <td>
                  <select
                    value={overrides[item.key] ?? item.category}
                    onChange={(e) =>
                      setOverrides((prev) => ({
                        ...prev,
                        [item.key]: e.target.value as RecurringCategory
                      }))
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
