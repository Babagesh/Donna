import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowUp, ArrowUpRight, RotateCcw, Sparkles } from 'lucide-react';
import { ASK_EXAMPLES, classifyAsk } from '@/components/donna/live/askClassify';
import { assembleAsk } from '@/components/donna/live/askAssemble';
import { askEvidenceQuery, useAskBook, useAskCompany, useAskDeals, useAskDonna, useAskRuns, useAskSignals } from '@/components/donna/live/useLiveAsk';
import { momentLabel } from '@/components/donna/live/liveShapes';
import LiveAskAnswer from '@/components/donna/live/LiveAskAnswer';
import LiveAskModelAnswer from '@/components/donna/live/LiveAskModelAnswer';

// Intended for LiveBook (no companyId) and LiveCompany (companyId scopes it to that counterparty).
/**
 * Cited search over the records stored for the signed-in account, answered on one of two
 * paths, and the surface always says which one answered.
 *
 * The floor is deterministic and unchanged: the question is classified by fixed keyword
 * rules, the matching stored signals, agreement terms, excerpts and coverage records are
 * retrieved through the Clerk-gated backend, and they are shown with their citations.
 *
 * Above it, the `askDonna` action asks a model to phrase an answer over records that the
 * SERVER retrieved. The model is never the source of a fact: a factual sentence with no
 * citation resolving to one of those records is stripped by the backend gate, and a draft
 * using reassuring or advisory language is rejected rather than edited. When no usable
 * model answer comes back -- no key configured, nothing citable retrieved, the gate
 * rejected both attempts, or the call failed -- the deterministic answer below is what is
 * shown, unchanged. There is no embedding and no vector store on either path.
 * @param {{companyId?:any}} props
 */
export default function LiveAsk({ companyId = null }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const live = Boolean(asked);
  const plan = live ? classifyAsk(asked) : null;

  const signals = useAskSignals(companyId, live);
  const runs = useAskRuns(companyId, live);
  const book = useAskBook(live && !companyId);
  const deals = useAskDeals(live && !companyId);
  const company = useAskCompany(companyId, live);
  const donna = useAskDonna(asked, companyId, live);

  const record = company.data?.pages[0] || null;
  const companies = companyId
    ? (record ? [{ company_id: companyId, canonical_name: record.company?.canonical_name, coverage: record.coverage, last_checked_at: record.company?.last_checked_at }] : [])
    : (book.data?.pages.flatMap(result => result.items) || []);
  const dealItems = companyId
    ? (company.data?.pages.flatMap(result => result.deals?.items || []) || [])
    : (deals.data?.pages.flatMap(result => result.items) || []);
  const signalItems = signals.data?.pages.flatMap(result => result.items) || [];

  const answer = plan ? assembleAsk({
    plan, companyId, companies, signals: signalItems, deals: dealItems,
    runs: runs.data?.items || [], signalsTotal: signals.data?.pages[0]?.total
  }) : null;

  // Which path answered. A label, not a score: there is no badge and no confidence
  // number, because either a line cites a stored record or it was removed.
  const modelAnswer = donna.data?.answer_status === 'model' ? donna.data : null;
  const pathLabel = modelAnswer
    ? `Answered by ${modelAnswer.model || 'the model'} over ${modelAnswer.candidate_count} retrieved ${modelAnswer.candidate_count === 1 ? 'record' : 'records'} · every line cites a stored record`
    : 'Answered by code from your stored records · no model answer was used';

  // Citation targets for the model's lines, resolved against the records this page
  // already holds. A deal or a run points at the counterparty page it belongs to;
  // anything else is read as a stored record on the evidence route. A coverage
  // pseudo-id names no single record, so it is shown without a link rather than
  // linked somewhere it does not resolve.
  const dealById = new Map(dealItems.map(deal => [deal.deal_id, deal]));
  const runById = new Map((runs.data?.items || []).map(run => [run.run_id, run]));
  const citationHref = id => {
    const deal = dealById.get(id);
    if (deal?.company_id) return `/live-company/${encodeURIComponent(deal.company_id)}#deals`;
    const run = runById.get(id);
    if (run?.company_id) return `/live-company/${encodeURIComponent(run.company_id)}#coverage`;
    if (/^cov-\d+$/.test(id)) return null;
    return `/live-evidence/${encodeURIComponent(id)}`;
  };

  // The stored excerpt carries no fetch time, so the snapshot behind each citation is read.
  const results = useQueries({ queries: (answer?.evidenceRefs || []).map(ref => askEvidenceQuery(ref.snapshot_id)) });
  const evidence = (answer?.evidenceRefs || []).map((ref, index) => {
    const snapshot = results[index]?.data?.snapshot || null;
    return {
      ...ref,
      excerpt: snapshot?.raw_excerpt || ref.excerpt,
      fetched_at: momentLabel(snapshot?.fetched_at),
      missing: Boolean(results[index]?.data) && !snapshot,
      error: results[index]?.isError ? results[index].error?.message : null
    };
  });

  // A read that fails is reported as a gap in the answer, never quietly dropped.
  const optional = [
    { label: 'Your companies', query: book, active: live && !companyId },
    { label: 'Your agreements', query: deals, active: live && !companyId },
    { label: 'This counterparty', query: company, active: live && Boolean(companyId) },
    { label: 'Collection runs', query: runs, active: live }
  ].filter(entry => entry.active);
  const gaps = optional.filter(entry => entry.query.isError).map(entry => ({ label: entry.label, message: entry.query.error?.message || 'The request could not complete.' }));
  // The model call is awaited too, so the answer cannot render deterministic and swap.
  const pending = live && (signals.isPending || donna.isPending || optional.some(entry => entry.query.isPending));

  const submit = value => { const text = String(value || '').trim(); if (text) { setAsked(text); setQuestion(''); } };

  return <section className="ask-panel" id="live-ask-donna">
    <div className="flex items-start gap-3">
      <span className="ask-symbol"><Sparkles size={18}/></span>
      <div className="flex-1">
        <div className="flex flex-wrap justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Ask Donna</h2>
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Cited search over your stored records</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Ask about observed signals, agreement terms, stored excerpts, or gaps in your {companyId ? 'counterparty record' : 'book'}. Answers retrieve stored records and show them with their citations.</p>
      </div>
    </div>

    <div aria-live="polite">
      {pending && <p role="status" className="reading-note mt-5">Retrieving your stored records…</p>}
      {live && !pending && signals.isError && <div role="alert" className="form-error mt-5">Your stored signals could not be read: {signals.error.message}<button type="button" className="text-link ml-3" onClick={() => signals.refetch()}>Retry</button></div>}
      {live && !pending && !signals.isError && answer && <>
        <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{pathLabel}</p>
        {!modelAnswer && donna.data?.reason && <p className="mb-2 text-[10px] text-muted-foreground">{donna.data.reason}</p>}
        {!modelAnswer && donna.isError && <p className="mb-2 text-[10px] text-muted-foreground">A model answer could not be requested: {donna.error.message}</p>}
        {modelAnswer
          ? <LiveAskModelAnswer question={asked} answer={modelAnswer} citationHref={citationHref}>
            <LiveAskAnswer answer={answer} evidence={evidence} gaps={gaps}/>
          </LiveAskModelAnswer>
          : <LiveAskAnswer answer={answer} evidence={evidence} gaps={gaps}/>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" className="text-link" onClick={() => setAsked('')}><RotateCcw size={12}/>Clear answer</button>
          {signals.hasNextPage && <button type="button" className="text-link" disabled={signals.isFetchingNextPage} onClick={() => signals.fetchNextPage()}>{signals.isFetchingNextPage ? 'Searching further back…' : 'Search further back through stored signals'}</button>}
          {!companyId && deals.hasNextPage && <button type="button" className="text-link" disabled={deals.isFetchingNextPage} onClick={() => deals.fetchNextPage()}>{deals.isFetchingNextPage ? 'Including more agreements…' : 'Include more stored agreements'}</button>}
        </div>
      </>}
    </div>

    <label htmlFor="live-ask-question" className="mt-5 block text-[11px] font-medium text-muted-foreground">Ask about your stored records</label>
    <form onSubmit={event => { event.preventDefault(); submit(question); }} className="ask-input" style={{ marginTop: 7 }}>
      <input id="live-ask-question" aria-describedby="live-ask-help" value={question} onChange={event => setQuestion(event.target.value)} maxLength={500} placeholder="Which counterparties have leadership changes?"/>
      <button type="submit" disabled={!question.trim()} aria-label="Search your stored records"><ArrowUp size={17}/></button>
    </form>

    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
      {ASK_EXAMPLES.map(example => <button type="button" key={example} className="suggested-question" onClick={() => submit(example)}>{example}<ArrowUpRight size={10}/></button>)}
    </div>

    <p id="live-ask-help" className="mt-3 text-[10px] text-muted-foreground">Read-only search over the records stored for your account. Retrieval is deterministic and happens on the server; a model may phrase the answer but is never the source of a fact, so every factual line cites a stored record and a line citing nothing is removed before you see it. A question asking for a verdict, a legal conclusion or advice is answered with the stored observations and the recorded coverage instead. Put a phrase in quotation marks to search stored excerpts.</p>
  </section>;
}
