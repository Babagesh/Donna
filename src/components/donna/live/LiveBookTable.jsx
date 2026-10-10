import React from 'react';
import { Link } from 'react-router-dom';
import CompanyTable from '@/components/donna/CompanyTable';
import { bookRow } from '@/components/donna/live/liveShapes';
/**
 * The search and sort toolbar stays here; the rows themselves are rendered by the
 * shared CompanyTable so the live book shows the same tier, observation, last-checked
 * and coverage columns as the sample book.
 * @param {{items:any[],total:number,search:string,sort:string,onSearch:any,onSort:any,busy:boolean}} props
 */
export default function LiveBookTable({ items, total, search, sort, onSearch, onSort, busy }) {
  const rows = (items || []).map(bookRow);
  return <section className="panel"><div className="table-toolbar"><h2 className="section-title">Recorded counterparties</h2><div className="table-tools flex-wrap"><label className="search-input"><span className="sr-only">Search counterparties</span><input type="search" value={search} maxLength={200} placeholder="Name or registration ID" onChange={e => onSearch(e.target.value)}/></label><label className="text-xs text-muted-foreground">Sort <select className="bg-background border border-input rounded p-2 ml-2" value={sort} onChange={e => onSort(e.target.value)}><option value="name">Legal name</option><option value="value">Annual value</option><option value="agreements">Agreement count</option></select></label></div></div>{busy ? <p className="empty-state" role="status">Loading counterparties…</p> : rows.length === 0 ? <div className="empty-state">{search ? 'No counterparties match this search.' : <>Your company list is empty. Use Add company above, or <Link to="/live-review">link an agreement</Link> to a recorded entity.</>}</div> : <CompanyTable rows={rows} base="/live-"/>}<div className="table-bottom"><span>{rows.length} shown · {total} matching counterparties</span><span>Values include resolved agreements only · Tier and coverage are copied from stored collection runs</span></div></section>;
}
