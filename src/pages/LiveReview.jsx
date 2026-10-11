import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import LiveResolutionCard from '@/components/donna/live/LiveResolutionCard';
import useLiveDeals from '@/components/donna/live/useLiveDeals';
export default function LiveReview() {
 /*
  * Both `unresolved` and `needs_review` are awaiting resolution, so both belong
  * here. Querying `needs_review` alone made a newly saved agreement INVISIBLE on
  * the one page whose job is to resolve it: intake writes `unresolved`, and only
  * clicking "find stored candidates" moves a deal to `needs_review` -- which you
  * could not do, because you could not find the deal. The page said "no
  * agreements awaiting review" while an unresolved agreement sat in the book.
  *
  * listDeals takes one status, so this fetches `all` and drops the resolved ones
  * here rather than adding a backend status just for this view.
  */
 const query=useLiveDeals('all');const [message,setMessage]=useState('');
 const rows=(query.data?.pages.flatMap(p=>p.items)||[]).filter(d=>d.status!=='resolved');
 const summary=query.data?.pages[0]?.summary;
 const total=summary?(summary.unresolved||0)+(summary.needs_review||0):rows.length;
 return <><div className="page-heading"><div><div className="page-kicker">LIVE AGREEMENTS · HUMAN REVIEW</div><h1>Resolution review</h1><p>A similar name is not a match. Link only the entity your agreement supports.</p></div><span className="count-chip">{total} awaiting review</span></div><LiveDataNotice/>{message&&<p role="status" className="form-success mb-5">{message} <Link className="citation" to="/live-intake">Open live intake</Link></p>}{query.isPending?<p role="status" className="reading-note">Loading agreements awaiting review…</p>:query.isError?<div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={()=>query.refetch()}>Retry</button></div>:rows.length?rows.map(deal=><LiveResolutionCard key={deal.deal_id} deal={deal} onComplete={setMessage}/>):<div className="panel empty-state"><h2 className="section-title">Every agreement is linked to a legal entity</h2><p className="mt-2">Nothing is waiting on a decision here. An agreement appears on this page from the moment it is saved, until you link it to the entity it names.</p><Link className="text-link mt-4" to="/live-intake">Add an agreement <ArrowRight size={13}/></Link></div>}{query.hasNextPage&&<button className="button-secondary mt-4" disabled={query.isFetchingNextPage} onClick={()=>query.fetchNextPage()}>{query.isFetchingNextPage?'Loading…':'Load more agreements'}</button>}</>;
}