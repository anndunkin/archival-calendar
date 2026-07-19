import { CalendarEvent, RecurringItem, RecurringCategory } from './types';
import { partsOf } from './dates';

const BIRTHDAY_WORDS = ['birthday', 'bday', 'b-day', 'born'];
const ANNIVERSARY_WORDS = ['anniversary', 'wedding', 'married'];

/** Best-effort category from subject keywords. */
export function categorize(subject: string): RecurringCategory {
  const s = subject.toLowerCase();
  if (BIRTHDAY_WORDS.some((w) => s.includes(w))) return 'Birthday';
  if (ANNIVERSARY_WORDS.some((w) => s.includes(w))) return 'Anniversary';
  return 'Other';
}

/**
 * Normalize a subject for grouping: lowercase, strip category words, punctuation
 * and stray year numbers, collapse whitespace. So "Mom's Birthday (2019)" and
 * "Moms birthday" collapse to the same key.
 */
export function normalizeSubject(subject: string): string {
  return subject
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/\b(19|20)\d{2}\b/g, ' ')
    .replace(/\b(birthday|bday|b-day|anniversary|wedding)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + cost);
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Similarity ratio in [0,1] based on normalized edit distance. */
export function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

const FUZZY_THRESHOLD = 0.82;

interface Cluster {
  rep: string; // representative normalized subject
  displaySubject: string;
  month: number;
  day: number;
  years: Set<number>;
  count: number;
  hasRrule: boolean;
}

export interface DetectOptions {
  fuzzy?: boolean;
}

/**
 * Detect annually-recurring items (birthdays, anniversaries, etc.).
 *
 * An item qualifies when either:
 *  - it carries an explicit yearly recurrence rule (RRULE FREQ=YEARLY) — an
 *    immediate high-confidence match, OR
 *  - the same month + day appears with a matching subject across 2+ distinct
 *    years (subject matched exactly, or fuzzily when `fuzzy` is enabled).
 *
 * A second pass then rejects false positives: a subject that shows up across
 * multiple *different* month/day dates anywhere in the archive is a
 * regularly-scheduled meeting, not a once-a-year date-based occasion, so it is
 * excluded entirely even if one of its date pairings happened to qualify by
 * coincidence. The distinct-date count is computed only from non-RRULE-yearly
 * instances, so an intentionally yearly RRULE item is still trusted.
 */
export function detectRecurringItems(
  events: CalendarEvent[],
  options: DetectOptions = {}
): RecurringItem[] {
  const fuzzy = options.fuzzy ?? false;
  // Bucket clusters by month|day so we only ever compare same-day events.
  const buckets = new Map<string, Cluster[]>();

  for (const event of events) {
    const parts = partsOf(event.start_date);
    if (!parts) continue;
    const { year, month, day } = parts;
    const norm = normalizeSubject(event.subject);
    if (!norm) continue;

    const bucketKey = `${month}|${day}`;
    const clusters = buckets.get(bucketKey) ?? buckets.set(bucketKey, []).get(bucketKey)!;

    let target: Cluster | undefined = clusters.find((c) =>
      fuzzy ? similarity(c.rep, norm) >= FUZZY_THRESHOLD : c.rep === norm
    );
    if (!target) {
      target = {
        rep: norm,
        displaySubject: event.subject.trim(),
        month,
        day,
        years: new Set<number>(),
        count: 0,
        hasRrule: false
      };
      clusters.push(target);
    }
    target.years.add(year);
    target.count++;
    if (/freq=yearly/i.test(event.rrule || '')) target.hasRrule = true;
  }

  // Second pass: for every normalized subject, collect the set of distinct
  // month|day combinations it appears on across the WHOLE archive, counting
  // only non-RRULE-yearly instances. When fuzzy matching is on, near-identical
  // subjects are merged under one canonical key so variants can't dodge the
  // filter. A subject confined to a single date passes; one scattered across 2+
  // dates is a recurring meeting and every cluster for it is dropped.
  const canonicalReps: string[] = [];
  const resolveCanonical = (norm: string): string => {
    if (!fuzzy) return norm;
    for (const rep of canonicalReps) {
      if (similarity(rep, norm) >= FUZZY_THRESHOLD) return rep;
    }
    canonicalReps.push(norm);
    return norm;
  };

  const nonRruleDatesBySubject = new Map<string, Set<string>>();
  for (const event of events) {
    const parts = partsOf(event.start_date);
    if (!parts) continue;
    const norm = normalizeSubject(event.subject);
    if (!norm) continue;
    const canonical = resolveCanonical(norm);
    let dates = nonRruleDatesBySubject.get(canonical);
    if (!dates) {
      dates = new Set<string>();
      nonRruleDatesBySubject.set(canonical, dates);
    }
    if (!/freq=yearly/i.test(event.rrule || '')) {
      dates.add(`${parts.month}|${parts.day}`);
    }
  }

  const items: RecurringItem[] = [];
  for (const clusters of buckets.values()) {
    for (const c of clusters) {
      const distinctYears = Array.from(c.years).sort((a, b) => a - b);
      const qualifies = c.hasRrule || distinctYears.length >= 2;
      if (!qualifies) continue;

      // Drop subjects that live on 2+ distinct dates (recurring meetings).
      const canonical = resolveCanonical(c.rep);
      const distinctDates = nonRruleDatesBySubject.get(canonical)?.size ?? 0;
      if (distinctDates >= 2) continue;

      items.push({
        key: `${c.rep}|${c.month}|${c.day}`,
        subject: c.displaySubject,
        month: c.month,
        day: c.day,
        years: distinctYears,
        count: c.count,
        category: categorize(c.displaySubject),
        source: c.hasRrule ? 'rrule' : 'inferred'
      });
    }
  }

  // Stable, useful ordering: by month, then day, then subject.
  items.sort(
    (a, b) => a.month - b.month || a.day - b.day || a.subject.localeCompare(b.subject)
  );
  return items;
}
