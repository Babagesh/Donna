import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import DealOverview from '@/components/donna/live/DealOverview';
export default function DealDetail() {
  const { id } = useParams();
  const query = useQuery({ queryKey: ['donna-live', 'deal', id], queryFn: () => liveRequest({ action: 'getDeal', deal_id: id }), retry: false });
  const record = query.data;
  return <><Link className="back-link" to="/"><ArrowLeft size={14}/>Back to your deals</Link><div className="page-heading mt-5"><div><div className="page-kicker">PRIVATE DEAL RECORD</div><h1>{record ? record.deal.title || `${record.deal.counterparty_name} agreement` : 'Deal details'}</h1>{record && <p>{record.deal.counterparty_name} · {record.deal.country} · Added to your account</p>}</div></div>{query.isPending ? <p className="reading-note" role="status">Loading deal details…</p> : query.isError ? <div className="form-error" role="alert">{query.error.message}<button className="text-link ml-3" onClick={() => query.refetch()}>Retry</button></div> : <DealOverview deal={record.deal} company={record.company}/>}<p className="text-xs text-muted-foreground leading-6 mt-6">Live news and the deal-specific retrieval chatbot still need to be connected. No external source checks have been performed for this view.</p></>;
}