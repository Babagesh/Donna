import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, AlertCircle } from 'lucide-react';
import useLiveBook from '@/components/donna/live/useLiveBook';
import { sourceCatalog } from '@/components/donna/contractFixtures';
import CoverageNote from '@/components/donna/CoverageNote';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import { aggregateCoverage, bookRow, coverageSentence, stampLabel } from '@/components/donna/live/liveShapes';
export default function LiveCoverage(){
 const book=useLiveBook();
 const rows=(book.data?.pages.flatMap(page=>page.items)||[]).map(bookRow);
 const {coverage,since}=aggregateCoverage(rows);
 const sentence=coverageSentence(coverage,since);
 const failing=rows.filter(row=>row.coverage.failed.length);
 return <><div className="page-heading"><div><div className="page-kicker">KNOW WHAT WAS CHECKED</div><h1>Source coverage</h1><p>Successful checks, failed attempts, and the limits of what we can observe.</p></div></div>
  <LiveDataNotice/>
  {book.isPending?<p role="status" className="reading-note">Loading stored coverage…</p>:book.isError?<div role="alert" className="form-error">{book.error.message}<button className="text-link ml-3" onClick={()=>book.refetch()}>Retry</button></div>:<>
   {Boolean(failing.length)&&<div className="reading-note mb-6"><AlertCircle size={16}/><span>{failing.length} {failing.length===1?'counterparty has':'counterparties have'} at least one failed source check. A failed check is a coverage gap, not a quiet source.</span></div>}
   <div className="panel table-scroll"><table className="coverage-table"><thead><tr><th>COUNTERPARTY</th>{sourceCatalog.map(source=><th key={source.id}>{source.label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><Link to={`/live-company/${row.id}`} className="whitespace-nowrap font-medium">{row.name}</Link></td>{sourceCatalog.map(source=><td key={source.id}>{row.coverage.failed.includes(source.id)?<span className="gap-label">Failed</span>:row.coverage.checked.includes(source.id)?<Link className="text-link" to={`/live-evidence/snap-${row.id}-${source.id}`}>Checked</Link>:<span className="text-[11px] text-[#8a8f80]">Not checked</span>}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="p-12 text-center text-sm text-[#777e6d]">No company is recorded in your account yet, so no source has been checked.</div>}<div className="table-bottom">“Checked” records a successful fetch, not a healthy counterparty · “Not checked” means no run is stored for that source</div></div>
   {book.hasNextPage&&<button className="button-secondary mt-4" disabled={book.isFetchingNextPage} onClick={()=>book.fetchNextPage()}>{book.isFetchingNextPage?'Loading…':'Load more counterparties'}</button>}
   <div className="mt-7"><CoverageNote sentence={sentence}/></div>
   <section className="mt-8"><div className="section-heading"><h2>Source failures</h2></div><div className="panel">{failing.map(row=><div className="failure-row" key={row.id}><AlertCircle size={16} className="text-[#a2855d]"/><div className="flex-1"><strong>{row.gaps.join(', ')} · {row.name}</strong><p>Last recorded attempt {stampLabel(row.last_checked_at)} UTC. The source was not successfully checked and remains a coverage gap.</p></div><Link className="text-link" to={`/live-company/${row.id}#coverage`}>View company <ArrowUpRight size={13}/></Link></div>)}{!failing.length&&<p className="p-6 text-sm text-[#7b826f]">No failed source check is recorded. This is not a statement that every source was checked — see the matrix above for what was not checked at all.</p>}</div></section>
  </>}
 </>;
}
