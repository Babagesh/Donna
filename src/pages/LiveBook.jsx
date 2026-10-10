import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import useLiveBook from '@/components/donna/live/useLiveBook';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import LiveBookStats from '@/components/donna/live/LiveBookStats';
import LiveBookTable from '@/components/donna/live/LiveBookTable';
import AddCompanyDialog from '@/components/donna/live/AddCompanyDialog';
import RecentBriefings from '@/components/donna/RecentBriefings';
import CoverageNote from '@/components/donna/CoverageNote';
import { dateLabel } from '@/components/donna/demoData';
import { aggregateCoverage, asTier, bookRow, citedLines, coverageSentence, dayOf } from '@/components/donna/live/liveShapes';
export default function LiveBook() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [sort, setSort] = useState('name');
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const query = useLiveBook(term, sort);
  const briefings = useInfiniteQuery({
    queryKey: ['donna-live', 'briefings', 'briefing'],
    queryFn: ({ pageParam }) => liveRequest({ action: 'listBriefings', mode: 'briefing', ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null, getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
    staleTime: 15000, retry: false
  });
  const record = query.data?.pages[0];
  const items = query.data?.pages.flatMap(page => page.items) || [];
  const rows = items.map(bookRow);
  const { coverage, since } = aggregateCoverage(rows);
  const sentence = coverageSentence(coverage, since);
  const latest = (briefings.data?.pages[0]?.items || []).slice(0, 3).map(briefing => {
    const checked = (briefing.coverage?.checked || []).length;
    const failed = (briefing.coverage?.failed || []).length;
    const day = dayOf(briefing.generated_at);
    return {
      id: briefing.briefing_id, href: `/live-briefing/${encodeURIComponent(briefing.briefing_id)}`,
      company_name: briefing.company_name || briefing.company_id, tier: asTier(briefing.top_tier),
      date_label: day ? dateLabel(day) : 'Generated date not recorded', title: briefing.headline,
      footer: `${citedLines(briefing).length} cited · ${checked} checked${failed ? ` · ${failed} gap` : ''}`
    };
  });
  return <>
    <div className="page-heading"><div><div className="page-kicker">ACCOUNT-SCOPED MONGODB BOOK</div><h1>Your companies</h1><p>What changed, with the evidence to understand it. Only companies and records in your account appear here.</p></div><div className="flex flex-wrap gap-2"><AddCompanyDialog/><button className="button-secondary" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={14}/>Refresh</button><Link className="button-primary" to="/live-intake">Add agreements <ArrowRight size={14}/></Link></div></div>
    <LiveDataNotice/>
    {record && <LiveBookStats summary={record.summary}/>}
    {query.isError ? <div className="form-error" role="alert">{query.error.message}<button className="text-link ml-3" onClick={() => query.refetch()}>Retry</button></div> : <>
      {briefings.isError
        ? <section className="reading-note mt-6" role="alert">Briefings could not be read: {briefings.error.message} That is a gap in this view, not an absence of change.<button className="text-link ml-3" onClick={() => briefings.refetch()}>Retry</button></section>
        : latest.length
          ? <RecentBriefings items={latest} base="/live-"/>
          : <section className="reading-note mt-6"><span><strong>No briefing has been issued. </strong>{sentence}</span></section>}
      <section className="mt-8">
        <LiveBookTable items={items} total={record?.total || 0} search={search} sort={sort} onSearch={setSearch} onSort={setSort} busy={query.isPending}/>
        {query.hasNextPage && <button className="button-secondary mt-4" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more counterparties'}</button>}
      </section>
      <div className="mt-5"><CoverageNote sentence={sentence}/></div>
      <div className="mt-4 flex flex-wrap gap-4"><Link className="text-link" to="/live-coverage">Source coverage matrix <ArrowRight size={13}/></Link><Link className="text-link" to="/live-briefings">All briefings <ArrowRight size={13}/></Link></div>
    </>}
  </>;
}
