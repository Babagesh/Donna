import React from 'react';
import { Link } from 'react-router-dom';
import { mockSignals } from '@/components/donna/contractFixtures';
import CitationLinks from '@/components/donna/CitationLinks';
/**
 * @param {{text:any,signalIds?:any[],dealIds?:any[],companyId?:any,signals?:any[],base?:string}} props
 */
export default function CitedNarrative({text,signalIds=[],dealIds=[],companyId=null,signals=mockSignals,base='/'}) {
 const sentences=String(text||'').split(/(?<=[.!?])\s+/);
 return <p className="text-sm text-muted-foreground leading-7 mt-3">{sentences.map((sentence,index)=><React.Fragment key={index}>{sentence}<CitationLinks ids={signalIds} companyId={companyId} signals={signals} base={base}/>{(dealIds||[]).map(id=><Link key={id} className="citation ml-1" to={`${base}company/${companyId}#deals`}>[{id}]</Link>)}{' '}</React.Fragment>)}</p>;
}
