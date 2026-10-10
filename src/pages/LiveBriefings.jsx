import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowUpRight, Search, Phone, FileText } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import useLiveBook from '@/components/donna/live/useLiveBook';
import TierBadge from '@/components/donna/TierBadge';
import CoverageNote from '@/components/donna/CoverageNote';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import { aggregateCoverage, asTier, bookRow, citedLines, coverageSentence, dayOf } from '@/components/donna/live/liveShapes';
import { dateLabel } from '@/components/donna/demoData';
export default function LiveBriefings(){
 const [search,setSearch]=useState('');const [tab,setTab]=useState('briefing');const [filter,setFilter]=useState('all');
 const query=useInfiniteQuery({queryKey:['donna-live','briefings',tab],queryFn:({pageParam})=>liveRequest({action:'listBriefings',mode:tab,...(pageParam?{cursor:pageParam}:{})}),initialPageParam:null,getNextPageParam:page=>page.has_more?page.next_cursor:undefined,staleTime:15000,retry:false});
 const book=useLiveBook();
 const items=query.data?.pages.flatMap(page=>page.items)||[];
 const records=items.filter(briefing=>`${briefing.company_name||''} ${briefing.headline||''}`.toLowerCase().includes(search.toLowerCase())&&(filter==='all'||filter==='verify'&&briefing.verify||filter==='fallback'&&briefing.narration_status==='fallback'));
 const {coverage,since}=aggregateCoverage((book.data?.pages.flatMap(page=>page.items)||[]).map(bookRow));
 const sentence=coverageSentence(coverage,since);
 return <><div className="page-heading"><div><div className="page-kicker">OBSERVED CHANGES</div><h1>Briefings</h1><p>Starting profiles and subsequent comparisons, with the evidence kept intact.</p></div><div className="search-input"><Search size={14}/><input placeholder="Find a counterparty…" aria-label="Search briefings" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
  <LiveDataNotice/>
  <div className="flex flex-wrap justify-between gap-4 mb-6"><div className="record-tabs" role="tablist" aria-label="Briefing type">{[['briefing','Change briefings'],['profile','Starting profiles']].map(([value,label])=><button role="tab" aria-selected={tab===value} key={value} className={tab===value?'selected':''} onClick={()=>{setTab(value);setFilter('all');}}>{label}{tab===value&&query.data&&<span className="count-chip ml-2">{query.data.pages[0]?.total||0}</span>}</button>)}</div>{tab==='briefing'&&<label className="text-xs text-muted-foreground flex gap-2 items-center">Show<select className="border rounded bg-card px-3 py-2 text-foreground" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All briefings</option><option value="verify">Verify with counterparty</option><option value="fallback">Signal-list fallback</option></select></label>}</div>
  {query.isPending?<p role="status" className="reading-note">Loading stored briefings…</p>:query.isError?<div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={()=>query.refetch()}>Retry</button></div>:<>
   <div className="briefing-list">{records.map(briefing=>{const checked=(briefing.coverage?.checked||[]).length;const failed=(briefing.coverage?.failed||[]).length;const cited=citedLines(briefing).length;const day=dayOf(briefing.generated_at);return <Link className="panel briefing-list-item" to={`/live-briefing/${encodeURIComponent(briefing.briefing_id)}`} key={briefing.briefing_id}><div><div className="flex flex-wrap gap-3 items-center">{briefing.mode==='profile'?<span className="count-chip">BASELINE · NOT AN ALERT</span>:<TierBadge tier={asTier(briefing.top_tier)}/>}<span className="text-xs text-muted-foreground">{day?dateLabel(day):'Generated date not recorded'}</span></div><p className="mt-4 text-xs text-muted-foreground">{briefing.company_name||briefing.company_id}</p><h2 className="mt-1 text-lg font-medium">{briefing.headline}</h2><p className="text-xs text-muted-foreground mt-3">{cited} cited {cited===1?'observation':'observations'} · {checked} sources checked{failed?` · ${failed} coverage gap`:''}</p>{briefing.verify&&<p className="text-link mt-3"><Phone size={12}/>Human verification requested</p>}{briefing.narration_status==='fallback'&&<p className="text-link mt-3"><FileText size={12}/>Narration unavailable · Signal list retained</p>}</div><ArrowUpRight size={20} className="text-muted-foreground shrink-0"/></Link>;})}</div>
   {!items.length&&<div className="panel empty-state"><p className="text-sm leading-6">No {tab==='profile'?'starting profile':'change briefing'} has been issued for your account.</p><p className="text-sm text-muted-foreground leading-6 mt-3">{sentence}</p></div>}
   {Boolean(items.length)&&!records.length&&<div className="panel empty-state">No records match these filters. Try another counterparty or select all briefings.</div>}
   {query.hasNextPage&&<button className="button-secondary mt-4" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more briefings'}</button>}
  </>}
  <div className="mt-6"><CoverageNote sentence={sentence}/></div></>;
}
