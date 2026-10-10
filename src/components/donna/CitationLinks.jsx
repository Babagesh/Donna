import React from 'react';
import { Link } from 'react-router-dom';
import { mockSignals } from '@/components/donna/contractFixtures';
export default function CitationLinks({ids=[],companyId}) {
 return <span className="inline-flex flex-wrap gap-2 ml-1">{ids.filter(id=>mockSignals.some(s=>s.signal_id===id&&(!companyId||s.company_id===companyId))).map(id=><Link key={id} className="citation" to={`/evidence/${id}`}>[{id}]</Link>)}</span>;
}