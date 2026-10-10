import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Gavel, Info, Landmark, ShieldCheck } from 'lucide-react';

/*
 * Public, unauthenticated landing page. No route is registered here on purpose.
 *
 * Every number on this page is traceable to the app's own sample book. Provenance,
 * so a later editor can check it rather than trust it:
 *
 *   $820,000  companies[nordvale].exposure in src/components/donna/demoData.js, which
 *             mockClusters surfaces as exposure.annual_value_usd. mockDeals splits it
 *             across the two linked agreements, so it is the counterparty total, not
 *             one agreement — the copy says "across two linked agreements".
 *   14%       share_pct for nordvale in src/components/donna/contractFixtures.js.
 *             nordvale's deal_class resolves to they_pay_us, i.e. a receivable, so
 *             share_pct is a share of revenue.
 *   90 days   notice_days in the same fixture row.
 *   141 days  mockClusters days_to_renewal, and independently derivable: end_date
 *             2027-02-28 counted from the sample book's 10 Oct 2026 "today".
 *   CFO       signals sig-003 in demoData.js — registry officer amendment, 8 Oct 2026.
 *   $540,000  signals sig-007 in demoData.js — Franklin County civil docket
 *             CV-2026-08317, filed 2 Oct 2026, pending.
 *   quiet     The coverage sentence is the one CoverageNote renders for a tier-0
 *   state     company: checked count plus the notCovered list, verbatim.
 *
 * The figures are deliberately hardcoded rather than imported, so that edits to the
 * fixtures cannot silently change what a public page claims. They are labelled
 * illustrative on the page itself.
 *
 * There are no market statistics on this page and none should be added. A fabricated
 * market figure would contradict the one thing the product sells.
 *
 * The credit-ceiling banner lives in src/components/landing/CreditBanner.jsx and is
 * meant for the book view, not here.
 */

const refusals = [
  ['No score.', 'There is no number, no grade and no green badge. A counterparty is not a credit rating we invented.'],
  ['No all-clear.', 'The quiet state names its own limits instead of implying safety: "no change observed across 8 sources since 3 Oct 2026. Not covered: private financials, payment behaviour, relationship sentiment, related-entity monitoring."'],
  ['No uncited line.', 'Every claim links to the record it came from — the filing, the docket entry, the notice — with the snapshot that was read and when it was fetched.'],
  ['No source without a trust level.', 'Primary records — registry, court, regulator — outrank reported ones. Job postings and site changes are inferred and are labelled as such. One reported source is a lead, not a finding.'],
  ['No invisible gap.', 'A collector that failed is shown as a failed check, with the time it failed. A gap never arrives as silence, because silence reads as reassurance.'],
  ['No advice.', 'Donna will say an observation is worth asking the counterparty about. It will not tell you what to do about your own agreement.'],
];

const doesList = [
  [Landmark, 'Watches the counterparties on agreements you record', 'You enter the agreement — counterparty, annual value, share of revenue or spend, notice period, dates. Donna monitors registries, court records, regulator notices, layoff filings, news, executive moves, job postings and site changes against it.'],
  [FileText, 'Reports change, with the record attached', 'A briefing says what changed, which source recorded it, when it was fetched, and what the agreement is worth. The excerpt is there to read, not summarised away.'],
  [Gavel, 'Ranks by what the source can support', 'A registry amendment and a court filing carry weight. A drop in open job postings is a pattern, labelled inferred, and is never dressed up as a finding.'],
  [ShieldCheck, 'Tells you what to verify directly', 'On a tier 1 observation the briefing names the question to put to the counterparty. The relationship is your real sensor; Donna only tells you where to point it.'],
];

const metrics = [
  ['ANNUAL VALUE', '$820,000', 'Across two linked agreements with this counterparty.'],
  ['SHARE OF REVENUE', '14%', 'A receivable. This counterparty is 14% of the line it sits in.'],
  ['NOTICE PERIOD', '90 days', 'The lever. It is in the agreement or it is not.'],
  ['TO STATED END DATE', '141 days', 'End date 28 Feb 2027, counted from 10 Oct 2026.'],
];

const observed = [
  ['Jane Doe was removed from the registry officer list as Chief Financial Officer on 8 October 2026.', 'Company registry', 'Primary'],
  ['The Franklin County civil docket records a $540,000 supplier claim filed on 2 October 2026. The claim is pending; no finding has been entered.', 'Court records', 'Primary'],
];

export default function Landing() {
  return (
    <div className="workspace min-h-screen overflow-x-hidden">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <span className="flex items-center gap-2 text-[23px] font-medium tracking-[-1.2px] text-foreground">
            <span className="font-serif text-[27px] italic leading-none text-secondary-foreground">d</span>
            <span>donna<span className="text-secondary-foreground">.</span></span>
          </span>
          <Link to="/login" className="text-link text-[11px]">Sign in <ArrowRight size={13} /></Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-12 sm:px-8 sm:pt-16">
        {/* 1. The problem. */}
        <section>
          <p className="eyebrow">COUNTERPARTY MONITORING</p>
          <h1 className="mt-4 max-w-3xl text-[30px] font-medium leading-[1.12] tracking-[-1.3px] text-foreground sm:text-[42px] sm:tracking-[-1.9px] lg:text-[50px]">
            You find out a counterparty is in trouble when they stop paying.
          </h1>
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            By then the notice period has gone. Donna watches the counterparties on your commercial
            agreements and reports observed change — the CFO removed from the officer list, the
            supplier claim on the docket, the layoff notice, the transfer of control — with the
            record it came from and the date it was read.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login" className="button-primary">Sign in <ArrowRight size={14} /></Link>
            <a href="#refuses" className="button-secondary">What it refuses to do</a>
          </div>
        </section>

        {/* 2. The gap, named. */}
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="max-w-2xl text-[21px] font-medium leading-[1.3] tracking-[-.6px] text-foreground sm:text-[25px]">
            The gap is between the counterparty deteriorating and you noticing. What you spend in
            that gap is the notice period.
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="panel p-6">
              <p className="eyebrow">WHAT HAPPENS</p>
              <p className="mt-4 text-[13px] leading-7 text-muted-foreground">
                A finance team signs an agreement worth a meaningful share of revenue. Over the
                following year the CFO leaves, a supplier files a claim, a workforce notice is
                posted, control of the company changes hands. All of it is recorded in public.
                None of it arrives in your inbox.
              </p>
            </div>
            <div className="panel p-6">
              <p className="eyebrow">WHAT IT COSTS</p>
              <p className="mt-4 text-[13px] leading-7 text-muted-foreground">
                The notice period is a dated instrument. It exists until the renewal and then it
                does not. Finding out at the renewal, or at the first missed payment, means you had
                the right in the contract the whole time and never got to use it.
              </p>
            </div>
          </div>
          <div className="reading-note mt-5">
            <Info size={16} />
            <span>
              We have no credible figure for what this costs the market, so there is not one on this
              page. The exposure that <em>is</em> knowable is the one on your own agreement, and it is
              below.
            </span>
          </div>
        </section>

        {/* 3. The money, made concrete from the data model. */}
        <section className="mt-16 border-t border-border pt-12">
          <p className="eyebrow">WHAT IS ACTUALLY AT STAKE</p>
          <h2 className="mt-4 max-w-2xl text-[21px] font-medium leading-[1.3] tracking-[-.6px] text-foreground sm:text-[25px]">
            Four fields on the agreement make the exposure explainable. So we explain it instead of
            estimating it.
          </h2>
          <p className="mt-5 max-w-2xl text-[13px] leading-7 text-muted-foreground">
            Annual value, share of revenue or spend, notice period, days to the stated end date.
            Donna holds those four, so it can state what an observation sits against without
            guessing. Worked through on one counterparty:
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="demo-label">ILLUSTRATIVE</span>
            <span className="text-muted-foreground">
              Nordvale Industrial, from the fictional sample book. Each figure is a field on the
              sample agreement or a line in a sample record — not a market estimate.
            </span>
          </div>

          <div className="mt-5 grid gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(([label, value, note]) => (
              <div key={label} className="bg-card px-5 py-5">
                <p className="eyebrow">{label}</p>
                <p className="stat-value break-words">{value}</p>
                <p className="mt-3 text-[10px] leading-5 text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>

          <div className="panel mt-5 p-6">
            <p className="eyebrow">WHAT WAS OBSERVED, AND WHERE IT CAME FROM</p>
            <ul className="mt-4 space-y-4">
              {observed.map(([fact, source, trust]) => (
                <li key={source} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                  <p className="text-[13px] leading-7 text-foreground">{fact}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                    <span className="count-chip">{source}</span>
                    <span>{trust} record</span>
                    <span aria-hidden="true">·</span>
                    <span>Tier 2</span>
                    <span aria-hidden="true">·</span>
                    <span>Links to the snapshot that was read</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel mt-5 p-6">
            <p className="eyebrow">WHAT IS WORTH KNOWING EARLY, STATED PLAINLY</p>
            <p className="mt-4 text-[14px] leading-7 text-foreground">
              $820,000 of annual value, and a renewal you can no longer re-price once the window
              closes. The 90-day notice period is the only lever either observation hands you, and it
              is available for 141 days and then it is not.
            </p>
            <p className="mt-4 text-[13px] leading-7 text-muted-foreground">
              Two primary records make this a finding. One reported source — a news item, a press
              release — would have made it a lead, and would have said so.
            </p>
            <div className="verify-box">
              <Clock size={17} />
              <div>
                <h3 className="text-[12px] font-semibold">What Donna does not say</h3>
                <p className="mt-2 text-[12px] leading-7">
                  That Nordvale is failing. A CFO can leave for a better job. A pending claim is a
                  claim, not a judgment. The registry and the docket are what we can show you. The
                  judgement is yours, and the counterparty is the one to ask.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. What it does. */}
        <section className="mt-16 border-t border-border pt-12">
          <p className="eyebrow">WHAT IT DOES</p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {doesList.map(([Icon, title, body]) => (
              <div key={title} className="panel p-6">
                <Icon size={18} className="text-primary" />
                <h3 className="mt-4 text-[13px] font-semibold leading-6 text-foreground">{title}</h3>
                <p className="mt-2 text-[12px] leading-7 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. What it refuses to do. */}
        <section id="refuses" className="mt-16 scroll-mt-6 border-t border-border pt-12">
          <p className="eyebrow">WHAT IT REFUSES TO DO</p>
          <h2 className="mt-4 max-w-2xl text-[21px] font-medium leading-[1.3] tracking-[-.6px] text-foreground sm:text-[25px]">
            Donna reports observed change. It never asserts health.
          </h2>
          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            {refusals.map(([title, body]) => (
              <div key={title} className="border-l-2 border-primary/30 pl-4">
                <dt className="text-[13px] font-semibold text-foreground">{title}</dt>
                <dd className="mt-2 text-[12px] leading-7 text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 6. Why it is built this way. */}
        <section className="mt-16 border-t border-border pt-12">
          <p className="eyebrow">WHY IT IS BUILT THIS WAY</p>
          <div className="panel mt-5 p-7">
            <p className="max-w-2xl font-serif text-[18px] leading-[1.9] text-foreground">
              The first person to test Donna was asked what would worry them most about it. Not a
              missed signal. A briefing that said all was well, followed by the client leaving.
            </p>
            <p className="mt-6 max-w-2xl text-[13px] leading-7 text-muted-foreground">
              That is the failure the whole product is shaped around. It is why there is no score to
              misread, why the quiet state lists what it does not cover, and why a collector that
              broke shows up as a gap rather than as nothing to report. A briefing you cannot check
              is worse than no briefing, because you act on it.
            </p>
          </div>
        </section>

        {/* 7. Sign in. */}
        <section className="mt-16 border-t border-border pt-12">
          <h2 className="text-[21px] font-medium leading-[1.3] tracking-[-.6px] text-foreground sm:text-[25px]">
            Your book is private to your account.
          </h2>
          <p className="mt-4 max-w-2xl text-[13px] leading-7 text-muted-foreground">
            New accounts start empty: you record the agreements, and monitoring runs against those.
            The sample book above is fictional and shared with everyone.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/login" className="button-primary">Sign in <ArrowRight size={14} /></Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-6 text-[10px] leading-5 text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
          <span>Observed facts. Traceable evidence. No health verdicts.</span>
          <span>Sample figures are fictional and labelled illustrative.</span>
        </div>
      </footer>
    </div>
  );
}
