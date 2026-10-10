import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';
import LinkedDeals from '@/components/donna/LinkedDeals';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import { liveRequest } from '@/components/donna/live/liveApi';
import { money } from '@/components/donna/demoData';
import TierBadge from '@/components/donna/TierBadge';
import SignalList from '@/components/donna/SignalList';
import SourceTable from '@/components/donna/SourceTable';
import ContractCoverage from '@/components/donna/ContractCoverage';
import { asTier, coverageOf, coverageSentence, initialsFor, stampLabel } from '@/components/donna/live/liveShapes';
export default function LiveCompany() {
 const {id}=useParams();
 const query=useInfiniteQuery({queryKey:['donna-live','company',id],queryFn:({pageParam})=>liveRequest({action:'getCompany',company_id:id,...(pageParam?{cursor:pageParam}:{})}),initialPageParam:null,getNextPageParam:page=>page.deals.has_more?page.deals.next_cursor:undefined,retry:false});
 const signals=useInfiniteQuery({queryKey:['donna-live','signals',id],queryFn:({pageParam})=>liveRequest({action:'listSignals',company_id:id,...(pageParam?{cursor:pageParam}:{})}),initialPageParam:null,getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:15000,retry:false});
 const runs=useQuery({queryKey:['donna-live','runs',id],queryFn:()=>liveRequest({action:'listRuns',company_id:id}),staleTime:15000,retry:false});
 const briefing=useQuery({queryKey:['donna-live','briefing','company',id],queryFn:()=>liveRequest({action:'getBriefing',company_id:id}),staleTime:15000,retry:false});
 const record=query.data?.pages[0];
 const deals=query.data?.pages.flatMap(page=>page.deals.items)||[];
 const signalItems=signals.data?.pages.flatMap(page=>page.items)||[];
 const runItems=runs.data?.items||[];
 const coverage=coverageOf(record?.coverage);
 const checkedAt=record?.company?.last_checked_at||null;
 const sentence=coverageSentence(coverage,checkedAt);
 const topTier=asTier(record?.company?.top_tier);
 const briefingRecord=briefing.data?.briefing||null;
 const briefingMissing=briefing.isError&&/not found/i.test(briefing.error?.message||'');
 return <><Link className="back-link" to="/live-book"><ArrowLeft size={14}/>Back to your companies</Link>
  <div className="page-heading mt-5"><div><div className="flex items-center gap-3 mb-3"><span className="company-monogram large">{initialsFor(record?.company?.canonical_name)}</span><TierBadge tier={topTier}/><span className="text-xs text-muted-foreground">LIVE LEGAL ENTITY · MANUAL RESOLUTION</span></div><h1>{record?.company.canonical_name||'Legal entity'}</h1>{record&&<p>{record.company.jurisdiction} · {record.company.registry_id || 'Registration ID not supplied'}</p>}</div><div className="flex flex-wrap gap-2">{briefingRecord&&<Link className="button-primary" to={`/live-briefing/${encodeURIComponent(briefingRecord.briefing_id)}`}><FileText size={15}/>Read briefing <ArrowUpRight size={14}/></Link>}{record&&<Link className="button-secondary" to={`/live-intake?company=${encodeURIComponent(id)}`}>Add a deal for this company</Link>}</div></div>
  <LiveDataNotice/>
  {query.isPending?<p role="status" className="reading-note">Loading legal entity and linked agreements…</p>:query.isError?<div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={()=>query.refetch()}>Retry</button></div>:<>
   <div className="detail-metrics"><div><small>ANNUAL AGREEMENT VALUE</small><strong>{money(record.totals.annual_value_usd)}</strong></div><div><small>LINKED AGREEMENTS</small><strong>{record.totals.deals}</strong></div><div><small>LATEST CHECK</small><strong className="!text-lg">{stampLabel(checkedAt)}{checkedAt?' UTC':''}</strong></div><div><small>OBSERVED SIGNALS</small><strong>{signals.isError?'—':signalItems.length}</strong></div></div>
   {briefing.isError&&<section className="reading-note mt-6">{briefingMissing?<span><strong>No briefing has been issued for this counterparty. </strong>{sentence}</span>:<span>The briefing could not be read: {briefing.error?.message} That is a gap in this view, not an absence of change.</span>}</section>}
   <div className="detail-columns mt-6"><div>
    <div className="section-heading"><h2>Signal timeline</h2><span className="text-xs text-muted-foreground">Most recent first</span></div>
    {topTier===3&&<div className="reading-note mb-4">Stored observations only. A single inferred signal does not produce a Tier 1 or Tier 2 briefing.</div>}
    {signals.isError?<div role="alert" className="form-error">{signals.error.message}<button className="text-link ml-3" onClick={()=>signals.refetch()}>Retry</button></div>:signals.isPending?<p role="status" className="reading-note">Loading stored signals…</p>:<><SignalList signals={signalItems} base="/live-" empty={sentence}/>{signals.hasNextPage&&<button className="button-secondary mt-4" disabled={signals.isFetchingNextPage} onClick={()=>signals.fetchNextPage()}>{signals.isFetchingNextPage?'Loading…':'Load more signals'}</button>}</>}
    <div id="coverage" className="mt-6 scroll-mt-5"><div className="section-heading"><h2>Sources &amp; collection runs</h2></div>
     {runs.isError?<div role="alert" className="form-error">{runs.error.message}<button className="text-link ml-3" onClick={()=>runs.refetch()}>Retry</button></div>:runs.isPending?<p role="status" className="reading-note">Loading collection runs…</p>:<SourceTable runs={runItems} base="/live-" evidenceId={run=>run.status==='failed'?null:`snap-${run.company_id}-${run.source}`} note="Copied from stored collection runs. Empty means the check returned no items; failed means the source was not successfully checked and remains a coverage gap."/>}
     <div className="mt-4"><ContractCoverage coverage={coverage} asOf={checkedAt}/></div>
    </div>
   </div>
   <aside><LinkedDeals deals={deals} live/>{query.hasNextPage&&<button disabled={query.isFetchingNextPage} className="button-secondary mt-4" onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more linked agreements'}</button>}<section className="panel p-5 mt-5"><h2 className="section-title">Recorded identity</h2><dl className="metadata-list"><dt>Canonical name</dt><dd>{record.company.canonical_name}</dd><dt>Aliases</dt><dd>{record.company.aliases?.join(', ')||'Not provided'}</dd><dt>Domains</dt><dd>{record.company.domains?.join(', ')||'Not provided'}</dd><dt>Resolution</dt><dd>{record.company.resolution?.reason||'Manually recorded, not independently verified'}</dd><dt>Recorded at</dt><dd>{record.company.created_date}</dd></dl><p className="text-[10px] text-muted-foreground mt-4">Identity is entered by hand and not independently verified. There is no composite score for this counterparty.</p></section></aside></div>
  </>}
 </>;
}
