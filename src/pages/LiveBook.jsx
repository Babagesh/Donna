import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import LiveBookStats from '@/components/donna/live/LiveBookStats';
import LiveBookTable from '@/components/donna/live/LiveBookTable';
import AddCompanyDialog from '@/components/donna/live/AddCompanyDialog';
export default function LiveBook() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [sort, setSort] = useState('name');
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const query = useInfiniteQuery({
    queryKey: ['donna-live', 'book', term, sort],
    queryFn: ({ pageParam }) => liveRequest({ action: 'getBook', search: term, sort, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null, getNextPageParam: page => page.has_more ? page.next_cursor : undefined,
    staleTime: 15000, retry: false
  });
  const record = query.data?.pages[0];
  const items = query.data?.pages.flatMap(page => page.items) || [];
  return <>
    <div className="page-heading"><div><div className="page-kicker">ACCOUNT-SCOPED MONGODB BOOK</div><h1>Your companies</h1><p>Add companies independently, then record agreements from each company page.</p></div><div className="flex flex-wrap gap-2"><AddCompanyDialog/><button className="button-secondary" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={14}/>Refresh</button><Link className="button-primary" to="/live-intake">Add agreements <ArrowRight size={14}/></Link></div></div>
    <LiveDataNotice/>
    {record && <LiveBookStats summary={record.summary}/>}
    {query.isError ? <div className="form-error" role="alert">{query.error.message}<button className="text-link ml-3" onClick={() => query.refetch()}>Retry</button></div> : <>
      <LiveBookTable items={items} total={record?.total || 0} search={search} sort={sort} onSearch={setSearch} onSort={setSort} busy={query.isPending}/>
      {query.hasNextPage && <button className="button-secondary mt-4" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more counterparties'}</button>}
    </>}
    <section className="reading-note mt-6">Coverage gap: no live collectors, source checks, signals, or briefings are connected to this book. No observed changes cannot be inferred from this view.</section>
  </>;
}