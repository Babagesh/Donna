import React from 'react';
import { Link } from 'react-router-dom';
import CitationLinks from '@/components/donna/CitationLinks';
export default function CitedNarrative({text,signalIds,dealIds,companyId}) {
 const sentences=text.split(/(?<=[.!?])\s+/);
 return <p className="text-sm text-muted-foreground leading-7 mt-3">{sentences.map((sentence,index)=><React.Fragment key={index}>{sentence}<CitationLinks ids={signalIds} companyId={companyId}/>{dealIds.map(id=><Link key={id} className="citation ml-1" to={`/company/${companyId}#deals`}>[{id}]</Link>)}{' '}</React.Fragment>)}</p>;
}