// Pure shape helpers for the live monitoring surfaces. No fetching and no fixtures:
// every value here is derived from a stored record returned by donnaIntake.
// The traps live in one place on purpose: tier coercion, date-only vs full ISO,
// and the citation rule that drops any briefing line without resolvable evidence.
import { sourceLabel } from '@/components/donna/contractFixtures';

/** tier / top_tier are integers; TierBadge indexes style[tier] with numeric keys. */
export const asTier = value => { const number = Number(value); return Number.isFinite(number) ? Math.trunc(number) : 0; };

/** coverage may be absent on a manually recorded company. Never return undefined arrays. */
export const coverageOf = record => ({
  checked: Array.isArray(record?.checked) ? record.checked : [],
  failed: Array.isArray(record?.failed) ? record.failed : [],
  not_covered: Array.isArray(record?.not_covered) ? record.not_covered : []
});

/** `initials` exists only in the fixtures, so derive it from canonical_name. */
export const initialsFor = name => String(name || '').split(/[^A-Za-z0-9]+/).filter(Boolean).slice(0, 2).map(word => word[0].toUpperCase()).join('') || '--';

const parsed = value => { if (!value) return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date : null; };

/** dateLabel() appends 'T12:00:00Z', so it needs date-only input, not a full ISO stamp. */
export const dayOf = value => parsed(value)?.toISOString().slice(0, 10) || null;
export const timeOf = value => parsed(value)?.toISOString().slice(11, 16) || null;
/** Short "9 Oct, 19:42" for table cells. */
export const stampLabel = value => { const date = parsed(value); return date ? `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}, ${date.toISOString().slice(11, 16)}` : 'Never checked'; };
/** Full "9 Oct 2026, 19:42 UTC" for prose. Null when the stamp is missing or unparseable. */
export const momentLabel = value => { const date = parsed(value); return date ? `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}, ${date.toISOString().slice(11, 16)} UTC` : null; };
/** "10 Oct · 19:42" for collection-run attempt times. */
export const attemptLabel = value => { const date = parsed(value); return date ? `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })} · ${date.toISOString().slice(11, 16)}` : 'Attempt time not recorded'; };

/**
 * The coverage sentence. This is the empty state for every monitoring surface:
 * what was checked, when, what failed, and what is never covered. Never a verdict,
 * never an all-clear, and a failed run is reported as a gap rather than as silence.
 * @param {any} coverage
 * @param {any} since
 */
export function coverageSentence(coverage, since) {
  const record = coverageOf(coverage);
  const when = momentLabel(since);
  const checked = record.checked.length;
  const opening = checked
    ? `No change observed across ${checked} ${checked === 1 ? 'source' : 'sources'}${when ? ` since ${when}` : ', and the time of the last check is not recorded'}`
    : 'No source has been successfully checked, so no change could have been observed';
  const notChecked = record.failed.length ? record.failed.map(sourceLabel).join(', ') : 'none recorded';
  const notCovered = record.not_covered.length ? record.not_covered.join(', ') : 'none recorded';
  return `${opening}; not checked: ${notChecked}; not covered: ${notCovered}.`;
}

/**
 * Union of coverage across book rows, plus the most recent successful check.
 * @param {any[]} rows
 */
export function aggregateCoverage(rows) {
  const checked = new Set(); const failed = new Set(); const notCovered = new Set();
  let since = null;
  for (const row of rows || []) {
    const record = coverageOf(row?.coverage);
    record.checked.forEach(id => checked.add(id));
    record.failed.forEach(id => failed.add(id));
    record.not_covered.forEach(label => notCovered.add(label));
    if (row?.last_checked_at && (!since || row.last_checked_at > since)) since = row.last_checked_at;
  }
  return { coverage: { checked: [...checked], failed: [...failed], not_covered: [...notCovered] }, since };
}

/**
 * No briefing line without its evidence link. A what_changed entry with a missing or
 * dangling signal_id is dropped, not rendered uncited.
 * @param {any} briefing
 * @param {any[]|null} signals Known signals; null checks only that a citation is present.
 */
export function citedLines(briefing, signals = null) {
  const known = signals ? new Set(signals.map(signal => signal?.signal_id)) : null;
  return (briefing?.what_changed || []).filter(line => line?.signal_id && (!known || known.has(line.signal_id)));
}

/**
 * getBook row -> the row shape CompanyTable renders. No sector and no composite
 * confidence: neither is collected, so neither is displayed.
 * @param {any} item
 */
export function bookRow(item) {
  const coverage = coverageOf(item?.coverage);
  const signal = item?.latest_signal || null;
  const checked = coverage.checked.length;
  return {
    id: item?.company_id,
    name: item?.canonical_name || 'Legal entity not named',
    initials: initialsFor(item?.canonical_name),
    country: item?.jurisdiction || 'Jurisdiction not recorded',
    subtitle: `${item?.jurisdiction || 'Jurisdiction not recorded'} · ${item?.registry_id || 'Registration ID not supplied'}`,
    deals: item?.agreements || 0,
    exposure: item?.annual_value_usd || 0,
    tier: asTier(item?.top_tier ?? signal?.tier),
    signal: signal?.title || 'No change observed',
    confidence: signal?.confidence || 'unstated',
    checked,
    gaps: coverage.failed.map(sourceLabel),
    time: timeOf(item?.last_checked_at),
    checked_label: stampLabel(item?.last_checked_at),
    observation_note: signal
      ? `${signal.confidence || 'unstated'} confidence · ${signal.status || 'status not recorded'}`
      : checked ? `Across ${checked} ${checked === 1 ? 'source' : 'sources'} checked` : 'No source successfully checked',
    coverage,
    last_checked_at: item?.last_checked_at || null
  };
}
