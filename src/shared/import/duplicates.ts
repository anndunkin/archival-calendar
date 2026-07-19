import { CalendarEvent, NewEvent } from '../types';

function norm(value: string | undefined | null): string {
  return (value ?? '').toString().trim().toLowerCase();
}

/** Duplicate key: same subject + same start date + same start time. */
export function dupKey(e: NewEvent): string {
  return `${norm(e.subject)}|${norm(e.start_date)}|${norm(e.start_time)}`;
}

export function buildDuplicateIndex(existing: CalendarEvent[]): Set<string> {
  const set = new Set<string>();
  for (const e of existing) set.add(dupKey(e));
  return set;
}

/** True when the candidate matches an existing event (subject + start date/time). */
export function isDuplicate(candidate: NewEvent, index: Set<string>): boolean {
  return index.has(dupKey(candidate));
}
