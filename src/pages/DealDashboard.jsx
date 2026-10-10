import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, LayoutGrid } from 'lucide-react';
import { money } from '@/components/donna/demoData';
import useLiveDeals from '@/components/donna/live/useLiveDeals';
import AddCompanyDialog from '@/components/donna/live/AddCompanyDialog';
import DealCard from '@/components/donna/live/DealCard';
export default function DealDashboard() {
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState('all');
  useEffect(() => { const timer = setTimeout(() => setTerm(search.trim()), 300); return () => clearTimeout(timer); }, [search]);
  const query = useLiveDeals(status, term);
  const record = query.data?.pages[0];
  const deals = query.data?.pages.flatMap(page => page.items) || [];
  const stats = record?.summary;
  return <>
    <div className="page-heading"><div><div className="page-kicker">YOUR PRIVATE WORKSPACE</div><h1>Your deals</h1><p>A clear view of every agreement. Only companies and deals added to your account appear here.</p></div><div className="flex flex-wrap gap-2"><AddCompanyDialog/><Link className="button-primary" to="/live-intake"><Plus size={14}/>Add deal</Link></div></div>
    {stats && <div className="stats-grid mb-7">{[['DEALS', stats.agreements, 'Recorded in your workspace'], ['COMPANIES', stats.companies, 'Your manually recorded companies'], ['ANNUAL DEAL VALUE', money(stats.annual_value_usd), 'Gross annual value, not net exposure'], ['AWAITING ENTITY REVIEW', stats.unresolved + stats.needs_review, 'Not yet linked to a legal entity']].map(([label, value, note]) => <div key={label} className="stat-cell"><div className="eyebrow">{label}</div><div className="stat-value">{value}</div><p className="stat-detail leading-5">{note}</p></div>)}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div className="flex items-center gap-2"><LayoutGrid size={16} className="text-primary"/><h2 className="section-title">Deal grid</h2>{record && <span className="count-chip">{record.total}</span>}</div><div className="flex flex-wrap items-center gap-2"><label className="search-input"><Search size={14}/><span className="sr-only">Search deals</span><input value={search} type="search" maxLength={200} onChange={e => setSearch(e.target.value)} placeholder="Search name or watch terms"/></label><select aria-label="Filter deal resolution" className="bg-card border border-input rounded p-2 text-xs" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All deals</option><option value="unresolved">No company linked</option><option value="needs_review">Needs review</option><option value="resolved">Company linked</option></select><button className="icon-button" aria-label="Refresh deals" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw size={14}/></button></div></div>
    {query.isPending ? <p role="status" className="reading-note">Loading your workspace…</p> : query.isError ? <div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={() => query.refetch()}>Retry</button></div> : deals.length ? <div className="deal-grid">{deals.map(deal => <DealCard key={deal.deal_id} deal={deal}/>)}</div> : <div className="panel empty-state"><LayoutGrid className="mx-auto mb-4 text-primary" size={28}/><h2 className="text-lg font-medium text-foreground">{term || status !== 'all' ? 'No matching deals' : 'Your workspace starts here'}</h2><p className="text-sm text-muted-foreground leading-6 mt-3 mb-5">{term || status !== 'all' ? 'Try a different search or resolution filter.' : 'No fictional deals, no shared book. Add your first company or agreement to get started.'}</p>{term || status !== 'all' ? <button className="button-secondary" onClick={() => { setSearch(''); setTerm(''); setStatus('all'); }}>Clear filters</button> : <Link className="button-primary" to="/live-intake"><Plus size={14}/>Add your first deal</Link>}</div>}
    {query.hasNextPage && <button className="button-secondary mt-5" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more deals'}</button>}
    <p className="text-xs text-muted-foreground leading-6 mt-6">Coverage gap: live news collection and deal-specific AI retrieval are not connected yet. An empty feed is not evidence that no changes occurred.</p>
  </>;
}