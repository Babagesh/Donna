import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, FileText, Search } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import CoverageNote from '@/components/donna/CoverageNote';
import { sourceLabel } from '@/components/donna/contractFixtures';

/*
 * Pre-deal lookup.
 *
 * Donna's pipeline is entered through an agreement, which means it otherwise
 * arrives one signature too late: the moment you most want a counterparty
 * profile is BEFORE you sign, while there is still a choice.
 *
 * This screen does not fetch anything itself. The surface never calls Bright
 * Data or Claude; it writes an intent (a company carrying `lookup`) and the
 * orchestrator picks it up on its next tick and runs one pass over the eight
 * sources. So `pending` here means NOT YET CHECKED, which is a different claim
 * from checked-and-clear, and this screen must never collapse the two.
 *
 * There is no exposure framing anywhere below, because there is no agreement
 * yet. The value is in the four profile sections, and the fourth is the one
 * you came for: what to ask before signing.
 */

const PENDING_COPY = {
  pending: 'Recorded. Nothing has been fetched yet — the collector pass runs on the orchestrator\'s next tick. This is not a result.',
  collected: 'Sources have been checked. The profile is still being written.',
};

export default function LiveLookup() {
  const client = useQueryClient();
  const [companyId, setCompanyId] = useState(null);
  const [error, setError] = useState('');

  const request = useMutation({
    mutationFn: (fields) => liveRequest({
      action: 'requestLookup', lookup: fields, request_id: crypto.randomUUID(),
    }),
    onSuccess: (data) => {
      setError('');
      setCompanyId(data.company?.company_id || null);
      client.invalidateQueries({ queryKey: ['donna-live', 'book-exposure'] });
    },
    onError: (e) => setError(e.message),
  });

  const result = useQuery({
    queryKey: ['donna-live', 'lookup', companyId],
    queryFn: () => liveRequest({ action: 'getLookup', company_id: companyId }),
    enabled: Boolean(companyId),
    // Poll while the orchestrator works, then stop. Not a fetch of our own.
    refetchInterval: (q) => (q.state.data?.status === 'ready' ? false : 8000),
    retry: false,
  });

  function submit(e) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    request.mutate({
      canonical_name: form.canonical_name,
      country: form.country,
      registry_id: form.registry_id || undefined,
      domain: form.domain || undefined,
      watch_until: form.watch_until || undefined,
    });
  }

  const data = result.data;
  const briefing = data?.briefing;
  const sections = briefing?.sections || [];

  return <>
    <div className="page-heading">
      <div>
        <div className="page-kicker">PRE-DEAL LOOKUP</div>
        <h1>Look up a company before you sign</h1>
        <p>
          One pass over the eight sources, and a profile that ends with what to ask before signing.
          No agreement required, and no exposure figures — there is nothing at stake yet.
        </p>
      </div>
      <Link className="button-secondary" to="/live-book">Your book <ArrowRight size={14} /></Link>
    </div>

    <LiveDataNotice />

    <form onSubmit={submit} className="panel p-6 mt-6">
      <h3 className="section-title">Who are you considering?</h3>
      <p className="text-xs text-muted-foreground mt-2 mb-4">
        Name and country are enough. A registration ID makes the match certain; without one, the
        company is resolved and parked for your review if confidence is low — a wrong match during
        diligence is worse than no answer.
      </p>
      <fieldset disabled={request.isPending} className="form-grid">
        <label className="form-field">
          <span>Company name *</span>
          <input name="canonical_name" maxLength={300} required placeholder="Nordvale Industrial" />
        </label>
        <label className="form-field">
          <span>Country *</span>
          <input name="country" maxLength={2} required placeholder="US" defaultValue="US" />
        </label>
        <label className="form-field">
          <span>Registration ID, if known</span>
          <input name="registry_id" maxLength={100} />
        </label>
        <label className="form-field">
          <span>Domain, if known</span>
          <input name="domain" maxLength={253} placeholder="example.com" />
        </label>
        <label className="form-field">
          <span>Watch until, if you are negotiating</span>
          <input name="watch_until" type="date" />
        </label>
      </fieldset>
      <p className="text-xs text-muted-foreground mt-3 leading-5">
        Leave the date blank for a one-off lookup: a single pass, no schedules, so a company you
        glanced at once cannot cost credits every day. Set a date and Donna keeps checking until
        then, which is worth it while a negotiation is open.
      </p>
      <button type="submit" disabled={request.isPending} className="button-primary mt-4">
        <Search size={14} />{request.isPending ? 'Recording…' : 'Look up this company'}
      </button>
      {error && <div className="form-error mt-4" role="alert">{error}</div>}
    </form>

    {companyId && (
      <section className="mt-7">
        {result.isError ? (
          <div className="form-error" role="alert">
            The lookup could not be read: {result.error.message}
            <button className="text-link ml-3" onClick={() => result.refetch()}>Retry</button>
          </div>
        ) : !data ? (
          <p className="reading-note">Reading the lookup…</p>
        ) : <>
          <div className="section-heading">
            <h2>{data.company?.canonical_name || 'Lookup'}</h2>
            <span className="eyebrow">
              {data.status === 'ready' ? 'PROFILE READY'
                : data.status === 'collected' ? 'SOURCES CHECKED'
                : 'NOT YET CHECKED'}
            </span>
          </div>

          {data.status !== 'ready' && (
            <div className="reading-note mt-4">
              <FileText size={16} />{PENDING_COPY[data.status] || 'Waiting on the orchestrator.'}
            </div>
          )}

          {data.watch_until && (
            <p className="text-xs text-muted-foreground mt-3">
              Watched until {data.watch_until}. After that the schedules expire and this company
              stops being checked unless it becomes an agreement.
            </p>
          )}

          {sections.length > 0 && (
            <div className="mt-5 space-y-4">
              {sections.map(section => (
                <section className="panel p-6" key={section.title}>
                  <h3 className="section-title">{section.title}</h3>
                  <p className="text-sm text-muted-foreground leading-7 mt-2">{section.text}</p>
                  {section.gap && (
                    <p className="text-[11px] mt-3">
                      This section states an absence rather than an observation.
                    </p>
                  )}
                </section>
              ))}
            </div>
          )}

          {data.runs?.length > 0 && (
            <div className="mt-6">
              <h3 className="section-title">What was checked</h3>
              <table className="w-full text-sm mt-3">
                <tbody>
                  {data.runs.map(run => (
                    <tr key={`${run.source}-${run.ended_at}`} className="border-t border-border">
                      <td className="py-2 pr-3">{sourceLabel(run.source) || run.source}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{run.status}</td>
                      <td className="py-2 text-xs text-muted-foreground">{run.error || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5">
            <CoverageNote sentence={data.coverage
              ? `${(data.coverage.checked || []).length} sources checked. ${(data.coverage.failed || []).length ? `Not checked: ${(data.coverage.failed || []).map(s => sourceLabel(s) || s).join(', ')}. ` : ''}Not covered: ${(data.coverage.not_covered || []).join(', ').toLowerCase()}.`
              : 'Nothing has been checked for this company yet, so there is no coverage to report. That is not the same as nothing being found.'} />
          </div>

          {data.status === 'ready' && !data.monitored && (
            <div className="panel p-6 mt-5">
              <h3 className="section-title">If you sign this one</h3>
              <p className="text-sm text-muted-foreground leading-7 mt-2">
                Add the agreement and this company keeps everything above. The snapshots taken for
                this lookup become the monitoring baseline, so day one of monitoring starts with
                history instead of a blank slate.
              </p>
              <Link className="button-primary mt-4" to={`/live-intake?company_id=${encodeURIComponent(companyId)}`}>
                Add an agreement <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </>}
      </section>
    )}
  </>;
}
