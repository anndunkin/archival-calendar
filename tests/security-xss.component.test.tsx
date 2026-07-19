import React from 'react';
import { render } from '@testing-library/react';
import { EventDetail } from '../src/renderer/components/EventDetail';
import { AgendaView } from '../src/renderer/components/AgendaView';
import { MonthView } from '../src/renderer/components/MonthView';
import { RecurringEvents } from '../src/renderer/components/RecurringEvents';
import { CalendarEvent, RecurringItem, emptyEvent } from '../src/shared/types';

/**
 * XSS / HTML-injection: event fields are attacker-controlled (imported from
 * arbitrary CSV/ICS). React escapes text children by default, and the app uses
 * no dangerouslySetInnerHTML. These tests lock that in: a malicious payload must
 * render as literal text and must NOT create live <script>/<img> DOM nodes.
 */
const SCRIPT_PAYLOAD = '<script>window.__xss__=1</script>';
const IMG_PAYLOAD = '<img src=x onerror="window.__xss__=1">';

function ev(patch: Partial<CalendarEvent>): CalendarEvent {
  return { ...emptyEvent(), id: Math.floor(Math.random() * 1e6), ...patch };
}

function assertNoInjectedNodes(container: HTMLElement) {
  expect(container.querySelector('script')).toBeNull();
  expect(container.querySelector('img')).toBeNull();
  expect((window as unknown as { __xss__?: number }).__xss__).toBeUndefined();
}

afterEach(() => {
  delete (window as unknown as { __xss__?: number }).__xss__;
});

describe('EventDetail renders malicious fields as inert text', () => {
  it('escapes script/img payloads in subject, description, location, category', () => {
    const { container } = render(
      <EventDetail
        event={ev({
          subject: SCRIPT_PAYLOAD,
          description: IMG_PAYLOAD,
          location: SCRIPT_PAYLOAD,
          category: IMG_PAYLOAD,
          start_date: '2020-01-01'
        })}
      />
    );
    assertNoInjectedNodes(container);
    // The literal markup is present as text content, proving it was escaped.
    expect(container.textContent).toContain('<script>');
    expect(container.textContent).toContain('onerror=');
  });
});

describe('AgendaView renders malicious fields as inert text', () => {
  it('escapes payloads in subject and location', () => {
    const { container } = render(
      <AgendaView
        events={[ev({ subject: SCRIPT_PAYLOAD, location: IMG_PAYLOAD, start_date: '2020-01-01' })]}
        selectedId={null}
        onSelect={() => {}}
      />
    );
    assertNoInjectedNodes(container);
    expect(container.textContent).toContain('<script>');
  });
});

describe('MonthView renders malicious event titles as inert text', () => {
  it('escapes a script payload in a day-cell event', () => {
    const { container } = render(
      <MonthView
        year={2020}
        month={1}
        events={[ev({ subject: SCRIPT_PAYLOAD, start_date: '2020-01-10' })]}
        selectedDate={null}
        onSelectDate={() => {}}
      />
    );
    assertNoInjectedNodes(container);
    expect(container.textContent).toContain('<script>');
  });
});

describe('RecurringEvents renders malicious fields as inert text', () => {
  it('escapes payloads in a recurring item subject/category', () => {
    const items: RecurringItem[] = [
      {
        key: 'x|1|1',
        subject: SCRIPT_PAYLOAD,
        month: 1,
        day: 1,
        years: [2020],
        count: 1,
        category: IMG_PAYLOAD as RecurringItem['category'],
        source: 'inferred'
      }
    ];
    const { container } = render(<RecurringEvents items={items} onExport={() => {}} />);
    assertNoInjectedNodes(container);
    expect(container.textContent).toContain('<script>');
  });
});
