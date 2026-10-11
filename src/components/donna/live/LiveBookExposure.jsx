import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CircleHelp, Clock, Layers } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import { sourceLabel } from '@/components/donna/contractFixtures';

/*
 * What the whole book carries.
 *
 * THERE IS NO SCORE ON THIS SCREEN AND THERE MUST NEVER BE ONE. Rule 1 of this
 * product is that it reports observed change and never asserts health. A single
 * number for a book is a verdict, and a verdict is the thing the first tester
 * said they would not trust. So every figure here is a sum of dollars the user
 * typed at intake, a count of companies, or a tier that came out of the rules
 * table -- each re-derivable on paper.
 *
 * Specifically: no gauge, no traffic light, no 0-100, no letter grade, and no
 * blended "total risk". If a figure cannot be explained by pointing at the
 * fields it was added up from, it does not belong on this screen.
 */

const currency = value => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(value || 0);

export default function LiveBookExposure() {
  const query = useQuery({
    queryKey: ['donna-live', 'book-exposure'],
    queryFn: () => liveRequest({ action: 'getBookExposure' }),
    staleTime: 15000, retry: false,
  });

  if (query.isError) {
    return (
      <section className="reading-note mt-6" role="alert">
        Book exposure could not be read: {query.error.message} That is a gap in this view, not an
        absence of exposure.
        <button className="text-link ml-3" onClick={() => query.refetch()}>Retry</button>
      </section>
    );
  }
  if (!query.data) {
    return <section className="reading-note mt-6">Reading the book totals…</section>;
  }

  const r = query.data;
  const failed = Object.entries(r.value_behind_failed_source || {})
    .sort((a, b) => b[1] - a[1]);

  const tiers = [
    ['Tier 1 · always surfaced', r.value_by_top_tier.tier1, 'Insolvency, ownership change, enforcement, sanctions, registry status'],
    ['Tier 2 · surfaced on exposure', r.value_by_top_tier.tier2, 'Senior departure, lawsuit, layoff notice, licence lapse'],
    ['Tier 3 · pattern only', r.value_by_top_tier.tier3, 'Three in a fortnight promote to tier 2'],
    ['No signal surfaced', r.value_by_top_tier.none, 'Checked and clear, or not yet checked — see coverage'],
  ];

  return (
    <section className="mt-6">
      <div className="page-kicker">BOOK EXPOSURE · COMPUTED ON READ, NEVER STORED</div>

      {/* The honest replacement for a risk score. Assembled by code from the
          figures below, never written by the narrator. */}
      <p className="mt-2 text-[15px] leading-6 max-w-[78ch]">{r.headline}</p>

      <div className="stats-grid mt-5">
        <div className="stat-cell">
          <div className="eyebrow">CONTRACTED VALUE</div>
          <div className="stat-value break-words">{currency(r.contracted_value_usd.total)}</div>
          <p className="stat-detail leading-5">
            {currency(r.contracted_value_usd.they_pay_us)} they pay us ·{' '}
            {currency(r.contracted_value_usd.we_pay_them)} we pay them ·{' '}
            {currency(r.contracted_value_usd.tied)} tied
          </p>
        </div>

        <div className="stat-cell">
          <div className="flex justify-between items-center">
            <span className="eyebrow">NOTICE WINDOW CLOSING</span>
            <Clock size={16} className="text-[#95998c]" />
          </div>
          <div className="stat-value break-words">{currency(r.value_notice_window_closing)}</div>
          <p className="stat-detail leading-5">
            Value whose notice window shuts within {r.notice_window_days} days, or already has
          </p>
        </div>

        <div className="stat-cell">
          <div className="flex justify-between items-center">
            <span className="eyebrow">HARD TO REPLACE</span>
            <Layers size={16} className="text-[#95998c]" />
          </div>
          <div className="stat-value break-words">{currency(r.value_hard_to_replace)}</div>
          <p className="stat-detail leading-5">
            On counterparties you marked hard to substitute
          </p>
        </div>

        <div className="stat-cell">
          <div className="flex justify-between items-center">
            <span className="eyebrow">EXPOSURE UNKNOWN</span>
            <CircleHelp size={16} className="text-[#95998c]" />
          </div>
          <div className="stat-value break-words">{currency(r.value_exposure_unknown)}</div>
          <p className="stat-detail leading-5">
            {r.companies_exposure_unknown}{' '}
            {r.companies_exposure_unknown === 1 ? 'counterparty is' : 'counterparties are'}{' '}
            missing share, substitutability or notice period. Unknown, not low
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="section-title">Contracted value by top signal tier</h3>
          <p className="text-xs text-muted-foreground mt-2 mb-3">
            Ordered by tier, never blended. A tier 3 never outranks a tier 1 however large the
            agreement.
          </p>
          <table className="w-full text-sm">
            <tbody>
              {tiers.map(([label, value, detail]) => (
                <tr key={label} className="border-t border-border align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground leading-5">{detail}</div>
                  </td>
                  <td className="py-2 text-right tabular-nums whitespace-nowrap">{currency(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="section-title">Value behind a source that could not be checked</h3>
          <p className="text-xs text-muted-foreground mt-2 mb-3">
            Money per source, by name. A coverage percentage would hide which sources are missing.
          </p>
          {failed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No source has failed for any counterparty in this book.
            </p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {failed.map(([source, value]) => (
                  <tr key={source} className="border-t border-border">
                    <td className="py-2 pr-3 flex items-start gap-2">
                      <AlertTriangle size={14} className="mt-1 shrink-0 text-[#95998c]" />
                      <span>{sourceLabel(source) || source}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums whitespace-nowrap">{currency(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-xs text-muted-foreground mt-3 leading-5">
            Not covered for any counterparty, by design:{' '}
            {(r.not_covered || []).map(c => c.toLowerCase()).join(', ')}.
          </p>
        </div>
      </div>

      {r.largest_counterparty && (
        <p className="text-xs text-muted-foreground mt-5 leading-5">
          Largest single counterparty:{' '}
          <Link className="text-link" to={`/live-company/${encodeURIComponent(r.largest_counterparty.company_id)}`}>
            {r.largest_counterparty.canonical_name}
          </Link>{' '}
          at {currency(r.largest_counterparty.annual_value_usd)}, {r.largest_counterparty.share_of_book_pct}% of
          contracted value
          {r.largest_counterparty.share_pct !== null
            && ` and ${r.largest_counterparty.share_pct}% of your revenue or spend by your own figure`}.
          {' '}Concentration is stated here, not scored.
        </p>
      )}

      {r.counterparties.lookup_only > 0 && (
        <p className="text-xs text-muted-foreground mt-2 leading-5">
          {r.counterparties.lookup_only} looked-up{' '}
          {r.counterparties.lookup_only === 1 ? 'company has' : 'companies have'} no agreement, so
          {r.counterparties.lookup_only === 1 ? ' it adds' : ' they add'} no contracted value above.
          <Link className="text-link ml-2" to="/live-lookup">Pre-deal lookups <ArrowRight size={13} /></Link>
        </p>
      )}
    </section>
  );
}
