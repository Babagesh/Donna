/**
 * Book exposure -- what the whole book carries, instead of one agreement.
 *
 * THIS IS NOT A SCORE, AND THAT IS THE POINT. Rule 1 of this product is that
 * it reports observed change and never asserts health. A single number for a
 * whole book is a verdict, and a verdict is exactly what the first tester said
 * they would not trust. So every figure below is either a sum of DOLLARS the
 * user typed at intake, a COUNT of companies, or a tier that came out of the
 * rules table -- each one re-derivable on paper.
 *
 * Three rules hold it to that:
 *
 *  1. NOTHING IS BLENDED. No figure here sums or averages an exposure weight.
 *     A per-agreement weight is explainable; thirty added together is a number
 *     nobody can check by hand. If you reach for a weight, you are building a
 *     score -- add the dollars instead.
 *
 *  2. UNKNOWN AGGREGATES AS UNKNOWN. share_pct, substitutability and
 *     notice_days are optional at intake and each only ever ADDS to a weight,
 *     so a sparsely described agreement always understates.
 *     value_exposure_unknown carries that up: a book that is mostly
 *     undescribed must read as mostly unknown, never as mostly low.
 *
 *  3. COVERAGE IS MONEY, NOT A PERCENTAGE. "94% coverage" hides which 6%.
 *     value_behind_failed_source states the value sitting behind each
 *     unreachable source BY NAME.
 *
 * Computed on read, never stored, so it cannot go stale behind the data.
 * Mirrors `bookExposureSchema` in donna-core's @donna/contracts.
 */

/** Verbatim from NOT_COVERED_CATEGORIES. True of every counterparty. */
const NOT_COVERED = [
  'Private financials',
  'Payment behaviour',
  'Relationship sentiment',
  'Related-entity monitoring',
];

/** The notice-window threshold, carried in the output so the figure explains itself. */
const NOTICE_WINDOW_DAYS = 90;

const DAY_MS = 86400000;

/** Whole days from today to a YYYY-MM-DD date. Negative means it has passed. */
function daysUntil(dateOnly: string, today: Date): number {
  const target = new Date(`${dateOnly}T12:00:00Z`);
  if (!Number.isFinite(target.getTime())) return Infinity;
  const base = new Date(`${today.toISOString().slice(0, 10)}T12:00:00Z`);
  return Math.round((target.getTime() - base.getTime()) / DAY_MS);
}

/**
 * Abbreviated money, for a line of prose rather than a table cell.
 * $4.2M / $820K / $900. Rounds to one decimal and drops a trailing .0.
 */
export function abbreviateUsd(value: number): string {
  const n = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const fmt = (v: number, suffix: string) => {
    const s = v.toFixed(1).replace(/\.0$/, '');
    return `${sign}$${s}${suffix}`;
  };
  if (n >= 1e9) return fmt(n / 1e9, 'B');
  if (n >= 1e6) return fmt(n / 1e6, 'M');
  if (n >= 1e3) return fmt(n / 1e3, 'K');
  return `${sign}$${Math.round(n)}`;
}

/**
 * An agreement whose exposure is a FLOOR rather than a measurement, because an
 * optional intake field that only ever adds weight was left blank. Mirrors
 * exposure_known in donna-core's exposureFor().
 */
function exposureUnknown(deal: Record<string, unknown>): boolean {
  const blank = (v: unknown) => v === undefined || v === null || v === '';
  return blank(deal.share_pct) || blank(deal.substitutability) || blank(deal.notice_days);
}

/**
 * The honest replacement for a risk score, assembled by CODE and never by the
 * narrator -- so no model writes it, the citation gate does not apply, and the
 * sentence cannot drift between screens. A sentence whose figure is zero is
 * omitted rather than printed as "$0", which would read as a reassurance.
 *
 * The language rules still apply: nothing here may say healthy, good standing,
 * safe or low risk, and nothing may read as advice.
 */
export function exposureHeadline(r: {
  contracted_value_usd: { total: number };
  counterparties: { monitored: number };
  sources_checked: number;
  value_by_top_tier: { tier1: number };
  value_exposure_unknown: number;
  not_covered: string[];
}): string {
  const parts: string[] = [];
  parts.push(
    `${abbreviateUsd(r.contracted_value_usd.total)} contracted across ${r.counterparties.monitored} ` +
    `${r.counterparties.monitored === 1 ? 'counterparty' : 'counterparties'}, ` +
    `watched on ${r.sources_checked} of 8 sources.`,
  );
  if (r.value_by_top_tier.tier1 > 0) {
    parts.push(`${abbreviateUsd(r.value_by_top_tier.tier1)} sits behind a tier-1 signal awaiting a human call.`);
  }
  if (r.value_exposure_unknown > 0) {
    parts.push(
      `${abbreviateUsd(r.value_exposure_unknown)} is incompletely described at intake, ` +
      `so its exposure is unknown rather than low.`,
    );
  }
  if (r.not_covered.length) {
    parts.push(`Not covered for any counterparty: ${r.not_covered.map((c) => c.toLowerCase()).join(', ')}.`);
  }
  return parts.join(' ');
}

export async function getBookExposure(db, user, _input) {
  const account = { book_id: user.id };
  const now = new Date();

  // Two small reads and the arithmetic in JS rather than one large pipeline.
  // The book is tens of companies, so the cost is irrelevant and a reader can
  // check every figure against the code -- which is the whole requirement here.
  const [companies, deals] = await Promise.all([
    db.collection('companies').find(account, {
      projection: {
        _id: 0, company_id: 1, canonical_name: 1, coverage: 1,
        top_tier: 1, monitoring_since: 1, lookup: 1,
      },
      maxTimeMS: 10000,
    }).toArray(),
    db.collection('deals').find({ ...account, status: 'resolved' }, {
      projection: {
        _id: 0, deal_id: 1, company_id: 1, deal_class: 1, annual_value_usd: 1,
        share_pct: 1, substitutability: 1, notice_days: 1, end_date: 1,
      },
      maxTimeMS: 10000,
    }).toArray(),
  ]);

  const dealsByCompany = new Map<string, Record<string, unknown>[]>();
  for (const deal of deals) {
    const key = String(deal.company_id ?? '');
    if (!key) continue;
    const list = dealsByCompany.get(key) ?? [];
    list.push(deal);
    dealsByCompany.set(key, list);
  }

  const value = (deal: Record<string, unknown>) => Number(deal.annual_value_usd ?? 0) || 0;
  const sum = (list: Record<string, unknown>[]) => list.reduce((t, d) => t + value(d), 0);

  const contracted = { total: 0, they_pay_us: 0, we_pay_them: 0, tied: 0 };
  let valueNoticeClosing = 0;
  let valueHardToReplace = 0;
  let valueExposureUnknown = 0;

  for (const deal of deals) {
    const v = value(deal);
    contracted.total += v;
    const cls = String(deal.deal_class ?? '');
    if (cls === 'they_pay_us' || cls === 'we_pay_them' || cls === 'tied') contracted[cls] += v;

    // The window shuts `notice_days` before the agreement ends. A window
    // already shut counts too -- that is worse, not better, so it is not
    // excluded.
    if (deal.end_date && deal.notice_days !== undefined && deal.notice_days !== null && deal.notice_days !== '') {
      const remaining = daysUntil(String(deal.end_date), now) - Number(deal.notice_days);
      if (Number.isFinite(remaining) && remaining <= NOTICE_WINDOW_DAYS) valueNoticeClosing += v;
    }
    if (deal.substitutability === 'hard') valueHardToReplace += v;
    if (exposureUnknown(deal)) valueExposureUnknown += v;
  }

  const byTier = { tier1: 0, tier2: 0, tier3: 0, none: 0 };
  const behindFailedSource: Record<string, number> = {};
  const checkedSources = new Set<string>();
  let monitored = 0;
  let lookupOnly = 0;
  let companiesExposureUnknown = 0;
  let largest: Record<string, unknown> | null = null;
  let largestValue = -1;

  for (const company of companies) {
    const id = String(company.company_id ?? '');
    const linked = dealsByCompany.get(id) ?? [];
    const companyValue = sum(linked);

    if (company.monitoring_since) monitored += 1;
    else if (company.lookup) lookupOnly += 1;

    const tier = Number(company.top_tier ?? 0);
    if (tier === 1) byTier.tier1 += companyValue;
    else if (tier === 2) byTier.tier2 += companyValue;
    else if (tier === 3) byTier.tier3 += companyValue;
    else byTier.none += companyValue;

    for (const source of company.coverage?.checked ?? []) checkedSources.add(String(source));
    // Rule 3: dollars per unreachable source, by name.
    for (const source of company.coverage?.failed ?? []) {
      const key = String(source);
      behindFailedSource[key] = (behindFailedSource[key] ?? 0) + companyValue;
    }

    if (linked.some(exposureUnknown)) companiesExposureUnknown += 1;

    if (companyValue > largestValue) {
      largestValue = companyValue;
      largest = {
        company_id: id,
        canonical_name: String(company.canonical_name ?? ''),
        annual_value_usd: companyValue,
        share_of_book_pct: contracted.total > 0
          ? Math.round((companyValue / contracted.total) * 10000) / 100
          : 0,
        share_pct: linked.reduce<number | null>((best, d) => {
          const s = d.share_pct;
          if (s === undefined || s === null || s === '') return best;
          const n = Number(s);
          return best === null || n > best ? n : best;
        }, null),
      };
    }
  }

  // share_of_book_pct needs the final total, which is only known after the loop.
  if (largest && contracted.total > 0) {
    largest.share_of_book_pct =
      Math.round((Number(largest.annual_value_usd) / contracted.total) * 10000) / 100;
  }

  const rollup = {
    book_id: user.id,
    as_of: now.toISOString(),
    counterparties: { total: companies.length, monitored, lookup_only: lookupOnly },
    contracted_value_usd: contracted,
    value_by_top_tier: byTier,
    value_notice_window_closing: valueNoticeClosing,
    notice_window_days: NOTICE_WINDOW_DAYS,
    value_hard_to_replace: valueHardToReplace,
    largest_counterparty: companies.length && largestValue > 0 ? largest : null,
    value_exposure_unknown: valueExposureUnknown,
    companies_exposure_unknown: companiesExposureUnknown,
    value_behind_failed_source: behindFailedSource,
    not_covered: NOT_COVERED,
    sources_checked: checkedSources.size,
  };

  return { ...rollup, headline: exposureHeadline(rollup) };
}
