// Pure retrieval and assembly for the live Ask surface. No fetching happens here and
// no fixtures are read: every value is derived from a stored record that donnaIntake
// already returned. The traps are handled once, in liveShapes: tier is an integer,
// first_seen is date-only while fetched_at is a full ISO stamp, and coverage arrays
// may be absent. `signal.confidence` is the stored word; `company.resolution.confidence`
// is a float and is never read here.
import { sourceLabel } from '@/components/donna/contractFixtures';
import { asTier, coverageOf, dayOf, momentLabel } from '@/components/donna/live/liveShapes';
import { ASK_COPY } from '@/components/donna/live/askClassify';

const MAX_ITEMS = 20;
const MAX_ROWS = 40;
const MAX_EVIDENCE = 3;
const MAX_FAILURES = 12;

/** Compare watch_terms against touches_terms without caring about case or separators. */
const normalizeTerm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

/** `watch_terms` is stored as free text; tolerate an array in case a record holds one. */
export function watchTermsOf(deal) {
  const raw = deal?.watch_terms;
  const parts = Array.isArray(raw) ? raw : String(raw || '').split(/[,;|\n]/);
  return [...new Set(parts.map(part => String(part || '').trim()).filter(Boolean))];
}

/** `touches_terms` may be missing or empty on any signal, so never dereference it blind. */
export function touchedTermsOf(signal) {
  const raw = signal?.touches_terms;
  const parts = Array.isArray(raw) ? raw : String(raw || '').split(/[,;|\n]/);
  return parts.map(part => String(part || '').trim()).filter(Boolean);
}

/** A baseline is the starting state, not a change, so it is never shown as an observation. */
const isObservedChange = signal => signal?.status !== 'baseline';

const evidenceOf = signal => (Array.isArray(signal?.evidence) ? signal.evidence : []).filter(Boolean);

/** Stored signals arrive with an integer tier and a date-only first_seen. Normalise both
 *  before any shared renderer touches them, or `dateLabel` yields "Invalid Date". */
const normalizeSignal = signal => ({ ...signal, tier: asTier(signal?.tier), first_seen: dayOf(signal?.first_seen), evidence: evidenceOf(signal) });

const haystack = signal => [
  signal?.title, signal?.summary_fact, signal?.type, signal?.status,
  touchedTermsOf(signal).join(' '),
  evidenceOf(signal).map(item => `${item.source || ''} ${item.excerpt || ''}`).join(' ')
].join(' ').toLowerCase();

/**
 * Does this stored signal match the question's plan? Type, source and keyword rules only.
 * @param {any} signal
 * @param {any} plan
 * @param {string} companyName
 */
function matchesPlan(signal, plan, companyName) {
  if (plan.broad) return true;
  const text = `${haystack(signal)} ${String(companyName || '').toLowerCase()}`;
  if (plan.types.some(type => String(signal?.type || '').toLowerCase().includes(type) || type.split('_').every(part => text.includes(part)))) return true;
  if (plan.sources.some(source => evidenceOf(signal).some(item => item.source === source))) return true;
  if (plan.quoted && text.includes(plan.quoted.toLowerCase())) return true;
  return plan.keywords.some(word => text.includes(word));
}

/**
 * Which recorded counterparties does the question name? Used only to narrow an unscoped
 * question; it never widens a scope that the page already fixed.
 * @param {any} plan
 * @param {any[]} companies
 */
export function mentionedCompanies(plan, companies) {
  const text = plan.question.toLowerCase();
  return (companies || []).filter(row => {
    const id = String(row?.company_id || '').toLowerCase();
    const name = String(row?.canonical_name || '').toLowerCase();
    if (id && text.includes(id)) return true;
    if (name && text.includes(name)) return true;
    const words = name.split(/[^a-z0-9]+/).filter(word => word.length > 3);
    return words.some(word => plan.keywords.includes(word));
  }).map(row => row.company_id);
}

function scopeSentence(names, total, asOf, searched, storedTotal) {
  const who = !total
    ? 'no counterparty is recorded in your account'
    : total === 1
      ? names[0] || 'one recorded counterparty'
      : `${total} counterparties in your book (${names.slice(0, 4).join(', ')}${total > 4 ? `, and ${total - 4} more` : ''})`;
  const when = asOf ? `as of the most recent successful check, ${asOf}` : 'no successful check is recorded, so there is no "as of" time';
  const depth = `searched ${searched} of ${storedTotal} stored ${storedTotal === 1 ? 'signal' : 'signals'}`;
  return `Scope: ${who} · ${when} · ${depth} · retrieved from stored records with their citations, not findings generated for this answer.`;
}

/**
 * Turn a classified question plus the stored records into a renderable answer.
 * @param {{plan:any,companyId?:any,companies?:any[],signals?:any[],deals?:any[],runs?:any[],signalsTotal?:number,dealsTotal?:number}} input
 */
export function assembleAsk(input) {
  const plan = input.plan;
  const companies = input.companies || [];
  const allSignals = input.signals || [];
  const allDeals = input.deals || [];
  const runs = input.runs || [];

  // Scope: the page's companyId wins; otherwise a named counterparty narrows the book.
  const named = input.companyId ? [input.companyId] : mentionedCompanies(plan, companies);
  const focus = named.length ? named : companies.map(row => row.company_id);
  const inFocus = id => !focus.length || focus.includes(id);
  const nameOf = id => companies.find(row => row?.company_id === id)?.canonical_name || id || 'Legal entity not named';

  const scopedSignals = allSignals.filter(signal => inFocus(signal?.company_id));
  const observed = scopedSignals.filter(isObservedChange).map(normalizeSignal);
  const baselineExcluded = scopedSignals.length - observed.length;

  const matched = plan.kind === 'coverage' ? [] : observed.filter(signal => matchesPlan(signal, plan, nameOf(signal.company_id)));
  const items = matched.slice(0, MAX_ITEMS);

  // Watched-term join: what was signed, against what a stored signal says it touches.
  const scopedDeals = allDeals.filter(deal => inFocus(deal?.company_id));
  const rows = [];
  let untracked = 0;
  if (plan.kind === 'terms' || plan.termsQuestion) {
    const unmatched = [];
    for (const deal of scopedDeals) {
      const terms = watchTermsOf(deal);
      if (!terms.length) { untracked += 1; continue; }
      for (const term of terms) {
        const key = normalizeTerm(term);
        const touching = observed.filter(signal => signal.company_id === deal.company_id
          && touchedTermsOf(signal).some(touched => { const other = normalizeTerm(touched); return Boolean(key) && Boolean(other) && (other.includes(key) || key.includes(other)); }));
        if (touching.length) touching.forEach(signal => rows.push({ id: `${deal.deal_id}-${key}-${signal.signal_id}`, deal, term, signal }));
        else unmatched.push({ id: `${deal.deal_id}-${key}`, deal, term, signal: null });
      }
    }
    rows.push(...unmatched.slice(0, Math.max(0, MAX_ROWS - rows.length)));
  }
  const rowsHidden = Math.max(0, scopedDeals.reduce((total, deal) => total + watchTermsOf(deal).length, 0) - rows.length - untracked);

  // Evidence: the stored excerpt, with the snapshot it came from. A quoted phrase is
  // searched against stored excerpts exactly, whatever else the question asked for.
  const quotedHits = plan.quoted
    ? observed.flatMap(signal => evidenceOf(signal)
      .filter(item => String(item.excerpt || '').toLowerCase().includes(plan.quoted.toLowerCase()))
      .map(item => ({ signal, item })))
    : [];
  const evidenceSource = quotedHits.length ? quotedHits : items.flatMap(signal => evidenceOf(signal).slice(0, 1).map(item => ({ signal, item })));
  const evidenceRefs = (plan.kind === 'evidence' || plan.quoted ? evidenceSource : []).slice(0, MAX_EVIDENCE).map(({ signal, item }) => ({
    snapshot_id: item.snapshot_id || signal.signal_id,
    signal_id: signal.signal_id,
    company_id: signal.company_id,
    company_name: nameOf(signal.company_id),
    source: item.source || null,
    source_label: item.source ? sourceLabel(item.source) : 'Source not recorded',
    trust: item.trust || 'not recorded',
    excerpt: item.excerpt || null,
    url: item.url || null
  }));

  // Coverage: recorded per counterparty, with failures named rather than left out.
  const coverage = companies.filter(row => inFocus(row?.company_id)).map(row => {
    const record = coverageOf(row?.coverage);
    return {
      company_id: row.company_id,
      name: row.canonical_name || 'Legal entity not named',
      checked: record.checked,
      failed: record.failed,
      not_covered: record.not_covered,
      checked_at: momentLabel(row?.last_checked_at)
    };
  });
  const scopedRuns = runs.filter(run => inFocus(run?.company_id));
  const brokenRuns = scopedRuns.filter(run => run?.status === 'failed' || run?.status === 'started');

  const asOf = momentLabel(companies.filter(row => inFocus(row?.company_id)).reduce((latest, row) => (row?.last_checked_at && (!latest || row.last_checked_at > latest) ? row.last_checked_at : latest), null));
  const hasResult = Boolean(items.length || rows.length || evidenceRefs.length);

  const framing = plan.verdict ? ASK_COPY.verdict
    : plan.kind === 'coverage' ? ASK_COPY.coverage
      : plan.kind === 'terms' ? ASK_COPY.terms
        : plan.kind === 'evidence' && evidenceRefs.length ? ASK_COPY.evidence
          : hasResult ? ASK_COPY.matches
            : ASK_COPY.none;

  const notes = [];
  if (plan.kind === 'terms' && !rows.some(row => row.signal)) notes.push(ASK_COPY.noTerms);
  if (untracked) notes.push(ASK_COPY.untracked(untracked));
  if (plan.kind === 'evidence' && !evidenceRefs.length && items.length) notes.push(ASK_COPY.noExcerpt);
  if (baselineExcluded > 0) notes.push(ASK_COPY.baseline(baselineExcluded));
  if (matched.length > items.length) notes.push(`${matched.length - items.length} further matching ${matched.length - items.length === 1 ? 'record is' : 'records are'} stored beyond the ${MAX_ITEMS} shown.`);
  if (rowsHidden) notes.push(`${rowsHidden} further watched ${rowsHidden === 1 ? 'term is' : 'terms are'} recorded beyond the rows shown.`);

  return {
    question: plan.question,
    kind: plan.kind,
    verdict: plan.verdict,
    quoted: plan.quoted,
    framing,
    notes,
    items,
    rows,
    evidenceRefs,
    coverage,
    runs: scopedRuns,
    brokenRuns: brokenRuns.slice(0, MAX_FAILURES),
    brokenRunsHidden: Math.max(0, brokenRuns.length - MAX_FAILURES),
    showRuns: plan.kind === 'coverage' || plan.verdict,
    scoped: Boolean(input.companyId) || named.length === 1,
    openCoverage: plan.kind === 'coverage' || plan.verdict || !hasResult,
    scopeLine: scopeSentence(coverage.map(row => row.name), coverage.length, asOf, observed.length, input.signalsTotal ?? observed.length)
  };
}
