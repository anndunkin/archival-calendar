import React from 'react';
import { CalendarEvent } from '../../shared/types';
import { formatLongDate } from '../calendar';

interface EventDetailProps {
  event: CalendarEvent;
}

function timeRange(e: CalendarEvent): string {
  if (e.all_day) return 'All day';
  if (e.start_time && e.end_time) return `${e.start_time} – ${e.end_time}`;
  return e.start_time || '';
}

/** Read-only detail card for a single archived event. */
export function EventDetail({ event }: EventDetailProps): JSX.Element {
  return (
    <div className="event-detail">
      <div className="event-detail-head">
        <strong className="event-subject">{event.subject || '(no subject)'}</strong>
        {event.category && <span className="badge">{event.category}</span>}
      </div>
      <div className="event-detail-time">
        {formatLongDate(event.start_date)}
        {timeRange(event) ? ` · ${timeRange(event)}` : ''}
      </div>
      {event.location && (
        <div className="event-detail-row">
          <span className="label">Location</span>
          <span>{event.location}</span>
        </div>
      )}
      {event.description && (
        <div className="event-detail-row">
          <span className="label">Description</span>
          <span style={{ whiteSpace: 'pre-wrap' }}>{event.description}</span>
        </div>
      )}
      {event.rrule && (
        <div className="event-detail-row">
          <span className="label">Recurrence</span>
          <span>{event.rrule}</span>
        </div>
      )}
      {event.source_file && (
        <div className="event-detail-row">
          <span className="label">Source</span>
          <span className="muted">{event.source_file}</span>
        </div>
      )}
    </div>
  );
}
