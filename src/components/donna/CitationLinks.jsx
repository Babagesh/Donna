import React from 'react';
import { Link } from 'react-router-dom';
import { mockSignals } from '@/components/donna/contractFixtures';
/**
 * The citation filter. An id that does not resolve to a known signal for this company
 * produces no link, which is what keeps uncited claims off the page.
 * @param {{ids?:any[],companyId?:any,signals?:any[],base?:string}} props
 */
export default function CitationLinks({ids=[],companyId=null,signals=mockSignals,base='/'}) {
 return <span className="inline-flex flex-wrap gap-2 ml-1">{(ids||[]).filter(id=>signals.some(signal=>signal.signal_id===id&&(!companyId||signal.company_id===companyId))).map(id=><Link key={id} className="citation" to={`${base}evidence/${id}`}>[{id}]</Link>)}</span>;
}
