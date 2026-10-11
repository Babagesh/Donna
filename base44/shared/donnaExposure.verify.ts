/**
 * Throwaway verification for the exposure rollup. Run:
 *   deno run --allow-net base44/shared/donnaExposure.verify.ts
 *
 * Exists because the rollup is arithmetic a reviewer must be able to redo on
 * paper, so the figures below are written as literals and checked, not eyeballed.
 */
import { getBookExposure, abbreviateUsd, exposureHeadline } from './donnaExposure.ts';
import { lookupRequestSchema, requestSchema } from './donnaValidation.ts';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) { console.error(`FAIL ${label}\n  expected ${e}\n  actual   ${a}`); failures++; }
  else console.log(`ok   ${label} = ${a}`);
}

// --- a book a reader can add up by hand ------------------------------------
// Big Lots      $820,000  they_pay_us  share 14  hard   notice 90  end 2026-12-01  tier 1
// Express       $400,000  they_pay_us  share 10  week   notice 30  end 2027-06-01  tier 2
// Smucker       $300,000  we_pay_them  (no share, no subst, no notice)            tier 0
// Dana          $180,000  tied         share 5   quarter notice 60 end 2028-01-01  tier 3
// Prospect Co   (lookup only, no deals)
const companies = [
  { company_id: 'co_big', canonical_name: 'Big Lots, Inc.', top_tier: 1, monitoring_since: '2026-10-01',
    coverage: { checked: ['registry', 'court', 'news', 'executives', 'jobs', 'domain'], failed: ['regulator', 'layoffs'] } },
  { company_id: 'co_exp', canonical_name: 'Express, Inc.', top_tier: 2, monitoring_since: '2026-10-01',
    coverage: { checked: ['registry', 'court'], failed: ['regulator', 'layoffs'] } },
  { company_id: 'co_smu', canonical_name: 'The J. M. Smucker Company', top_tier: 0, monitoring_since: '2026-10-01',
    coverage: { checked: ['registry'], failed: ['regulator', 'layoffs'] } },
  { company_id: 'co_dan', canonical_name: 'Dana Incorporated', top_tier: 3, monitoring_since: '2026-10-01',
    coverage: { checked: ['registry'], failed: ['regulator', 'layoffs'] } },
  { company_id: 'co_pro', canonical_name: 'Prospect Co', lookup: { requested_at: '2026-10-10T19:00:00Z', requested_by: 'u1', watch_until: null } },
];
const deals = [
  { deal_id: 'd1', company_id: 'co_big', deal_class: 'they_pay_us', annual_value_usd: 820000, share_pct: 14, substitutability: 'hard', notice_days: 90, end_date: '2026-12-01', status: 'resolved' },
  { deal_id: 'd2', company_id: 'co_exp', deal_class: 'they_pay_us', annual_value_usd: 400000, share_pct: 10, substitutability: 'week', notice_days: 30, end_date: '2027-06-01', status: 'resolved' },
  { deal_id: 'd3', company_id: 'co_smu', deal_class: 'we_pay_them', annual_value_usd: 300000, end_date: '2027-01-01', status: 'resolved' },
  { deal_id: 'd4', company_id: 'co_dan', deal_class: 'tied', annual_value_usd: 180000, share_pct: 5, substitutability: 'quarter', notice_days: 60, end_date: '2028-01-01', status: 'resolved' },
];

const db = {
  collection(name: string) {
    const rows = name === 'companies' ? companies : name === 'deals' ? deals : [];
    return { find: () => ({ toArray: async () => rows }) };
  },
};

const r = await getBookExposure(db, { id: 'book_1' }, {});

check('contracted total', r.contracted_value_usd.total, 1700000);
check('they_pay_us', r.contracted_value_usd.they_pay_us, 1220000);
check('we_pay_them', r.contracted_value_usd.we_pay_them, 300000);
check('tied', r.contracted_value_usd.tied, 180000);
check('counterparties', r.counterparties, { total: 5, monitored: 4, lookup_only: 1 });
check('value by tier', r.value_by_top_tier, { tier1: 820000, tier2: 400000, tier3: 180000, none: 300000 });
// Only Smucker is missing optional fields -> $300k unknown, 1 company.
check('exposure unknown value', r.value_exposure_unknown, 300000);
check('exposure unknown companies', r.companies_exposure_unknown, 1);
check('hard to replace', r.value_hard_to_replace, 820000);
// Big Lots ends 2026-12-01 with 90 days notice -> the window shut 2026-09-02,
// already past, so it counts (a shut window is worse, not better). Express
// (deadline 2027-05-02) and Dana (2027-11-02) are far out; Smucker has no
// notice_days so it cannot be assessed and is excluded rather than assumed.
check('notice window closing', r.value_notice_window_closing, 820000);
check('notice window threshold', r.notice_window_days, 90);
// Rule 3: every company has regulator+layoffs failed, so the whole book sits behind each.
check('behind regulator', r.value_behind_failed_source.regulator, 1700000);
check('behind layoffs', r.value_behind_failed_source.layoffs, 1700000);
check('largest counterparty', r.largest_counterparty?.canonical_name, 'Big Lots, Inc.');
check('largest share of book', r.largest_counterparty?.share_of_book_pct, 48.24);
check('largest own share_pct', r.largest_counterparty?.share_pct, 14);
check('sources checked (union)', r.sources_checked, 6);
check('not covered count', r.not_covered.length, 4);

// --- money formatting ------------------------------------------------------
check('abbrev 4.2M', abbreviateUsd(4200000), '$4.2M');
check('abbrev 820K', abbreviateUsd(820000), '$820K');
check('abbrev 1M flat', abbreviateUsd(1000000), '$1M');
check('abbrev small', abbreviateUsd(900), '$900');
check('abbrev zero', abbreviateUsd(0), '$0');

// --- the headline ----------------------------------------------------------
console.log('\nheadline:\n  ' + r.headline + '\n');

// Rule 1 guard: the forbidden language from the narrator applies here too.
const FORBIDDEN = /(?<![A-Za-z])(healthy|good\s+standing|safe|safely|low[\s-]risk|breach|breached|you\s+should|you\s+must)(?![A-Za-z])/i;
check('headline has no forbidden language', FORBIDDEN.test(r.headline), false);
check('headline mentions tier-1 money', r.headline.includes('$820K sits behind a tier-1 signal'), true);
check('headline mentions unknown', r.headline.includes('unknown rather than low'), true);

// Zero-figure sentences are omitted rather than printed as $0.
const quiet = exposureHeadline({
  contracted_value_usd: { total: 500000 }, counterparties: { monitored: 3 },
  sources_checked: 6, value_by_top_tier: { tier1: 0 }, value_exposure_unknown: 0, not_covered: [],
});
check('quiet headline omits zero sentences', quiet, '$500K contracted across 3 counterparties, watched on 6 of 8 sources.');

// --- empty book ------------------------------------------------------------
const emptyDb = { collection: () => ({ find: () => ({ toArray: async () => [] }) }) };
const e = await getBookExposure(emptyDb, { id: 'book_1' }, {});
check('empty: largest is null', e.largest_counterparty, null);
check('empty: total 0', e.contracted_value_usd.total, 0);
check('empty: headline still a sentence', e.headline.length > 10, true);

// --- validation ------------------------------------------------------------
check('lookup needs a country', lookupRequestSchema.safeParse({ canonical_name: 'Acme' }).success, false);
check('lookup minimal ok', lookupRequestSchema.safeParse({ canonical_name: 'Acme', country: 'us' }).success, true);
check('lookup rejects past watch_until', lookupRequestSchema.safeParse({ canonical_name: 'Acme', country: 'US', watch_until: '2020-01-01' }).success, false);
check('lookup accepts future watch_until', lookupRequestSchema.safeParse({ canonical_name: 'Acme', country: 'US', watch_until: '2027-01-01' }).success, true);
check('getBookExposure action parses', requestSchema.safeParse({ action: 'getBookExposure' }).success, true);
check('requestLookup action parses', requestSchema.safeParse({ action: 'requestLookup', lookup: { canonical_name: 'Acme', country: 'US' }, request_id: crypto.randomUUID() }).success, true);
check('getLookup action parses', requestSchema.safeParse({ action: 'getLookup', company_id: 'co_1' }).success, true);
check('unknown action rejected', requestSchema.safeParse({ action: 'getRiskScore' }).success, false);

console.log(failures ? `\n${failures} FAILURE(S)` : '\nALL CHECKS PASSED');
if (failures) Deno.exit(1);
