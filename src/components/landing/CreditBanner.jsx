import React from 'react';
import { AlertCircle, Info, PauseCircle } from 'lucide-react';

// Mount this on the book view (src/pages/LiveBook.jsx), above the book stats, so the
// credit ceiling is visible wherever "no change observed" is read.

const DEFAULT_CEILING = 300;

/**
 * Bright Data collection credits against the event ceiling.
 *
 * Presentational only — the caller supplies the figures (the orchestrator sums
 * `credits_spent` across collection runs and stops scheduling at the ceiling).
 *
 * Three states, because the third one is the reason this exists: if scheduling has
 * halted, every "no change observed" line in the book is as of `as_of` and has not
 * been rechecked since. An absence of data must never read as reassurance, so a
 * frozen book has to say it is frozen rather than look like a quiet one.
 *
 * A missing or unusable figure is reported as unknown, not as zero — the same rule
 * that applies to a collector that broke.
 *
 * @param {{spent?:any, ceiling?:any, as_of?:any, className?:string}} props
 */
export default function CreditBanner({ spent, ceiling = DEFAULT_CEILING, as_of = null, className = '' }) {
  const used = Number(spent);
  const cap = Number(ceiling);
  const known = Number.isFinite(used) && used >= 0 && Number.isFinite(cap) && cap > 0;
  const when = asOfLabel(as_of);

  if (!known) {
    return (
      <Banner tone="unknown" icon={AlertCircle} title="Credit spend is not recorded." className={className} alert>
        <p>
          The collection budget could not be read, so whether collection is still running is
          unknown. Treat every unchanged line in this book as unverified until it is. A missing
          figure is a gap, not a confirmation that anything was checked.
        </p>
      </Banner>
    );
  }

  const remaining = Math.max(0, cap - used);
  const share = Math.min(1, used / cap);
  const halted = used >= cap;
  const approaching = !halted && share >= 0.8;
  const tone = halted ? 'halted' : approaching ? 'approaching' : 'normal';

  return (
    <Banner
      tone={tone}
      icon={halted ? PauseCircle : approaching ? AlertCircle : Info}
      title={halted
        ? 'Collection has stopped. Coverage is frozen.'
        : approaching
          ? 'Approaching the collection credit ceiling.'
          : 'Collection credits'}
      className={className}
      alert={halted}
      meter={share}
      figure={`${formatCredits(used)} / ${formatCredits(cap)} credits`}
    >
      {halted ? (
        <p>
          The {formatCredits(cap)}-credit ceiling has been reached and no further collection runs
          are being scheduled. Coverage is frozen as of {when}. Every &ldquo;no change observed&rdquo;
          line in this book describes what was true at {when} and has not been rechecked since —
          read it as stale, not as reassurance.
        </p>
      ) : approaching ? (
        <p>
          {formatCredits(remaining)} of {formatCredits(cap)} credits remain. At the ceiling,
          scheduling stops and coverage freezes at that point rather than continuing quietly.
          Counted as of {when}.
        </p>
      ) : (
        <p>
          {formatCredits(used)} of {formatCredits(cap)} credits spent, {formatCredits(remaining)}{' '}
          remaining, as of {when}. Scheduling stops at the ceiling.
        </p>
      )}
    </Banner>
  );
}

/** @param {{tone:string, icon:any, title:string, children:any, className?:string, alert?:boolean, meter?:number, figure?:string}} props */
function Banner({ tone, icon: Icon, title, children, className = '', alert = false, meter = null, figure = null }) {
  const skin = {
    normal: 'border-border bg-card text-muted-foreground',
    approaching: 'border-border bg-accent text-accent-foreground',
    halted: 'border-secondary-foreground/35 bg-secondary text-secondary-foreground',
    unknown: 'border-secondary-foreground/35 bg-secondary text-secondary-foreground',
  }[tone] || 'border-border bg-card text-muted-foreground';

  return (
    <section
      className={`flex gap-3 rounded-[var(--radius)] border p-4 ${skin} ${className}`}
      {...(alert ? { role: 'alert' } : {})}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-[12px] font-semibold">{title}</h2>
          {figure && <span className="text-[11px] tabular-nums">{figure}</span>}
        </div>
        <div className="mt-1 text-[12px] leading-6 [&>p]:m-0">{children}</div>
        {meter != null && (
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-sm bg-foreground/10">
            <div
              className="h-full bg-current"
              style={{ width: `${Math.round(meter * 100)}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/** @param {any} value */
function formatCredits(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

/** @param {any} value */
function asOfLabel(value) {
  if (!value) return 'a time that was not recorded';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'a time that was not recorded';
  return `${date.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
  })} UTC`;
}
