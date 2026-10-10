import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import DealForm from '@/components/donna/DealForm';
import CSVIntake from '@/components/donna/CSVIntake';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import LiveDealQueue from '@/components/donna/live/LiveDealQueue';
import useLiveDeals from '@/components/donna/live/useLiveDeals';
import { liveRequest } from '@/components/donna/live/liveApi';
export default function LiveIntake() {
 const [status,setStatus]=useState('all');const query=useLiveDeals(status);const cache=useQueryClient();const navigate=useNavigate();
 const companyId=new URLSearchParams(window.location.search).get('company');
 const companyQuery=useQuery({queryKey:['donna-live','company',companyId,'intake'],queryFn:()=>liveRequest({action:'getCompany',company_id:companyId}),enabled:!!companyId,retry:false});
 const company=companyQuery.data?.company;
 async function save(rows){const result=await liveRequest({action:'createDeals',request_id:crypto.randomUUID(),rows,...(companyId?{company_id:companyId}:{})});await cache.invalidateQueries({queryKey:['donna-live']});if(rows.length===1)navigate(`/deals/${encodeURIComponent(result.deal_ids[0])}`);}
 if(companyId&&companyQuery.isPending)return <p className="reading-note" role="status">Loading selected company…</p>;
 if(companyId&&companyQuery.isError)return <div className="form-error" role="alert">{companyQuery.error.message}<Link className="text-link ml-3" to="/live-book">Back to companies</Link></div>;
 return <><div className="page-heading"><div><div className="page-kicker">LIVE AGREEMENTS</div><h1>Add a deal</h1><p>{company ? `This agreement will be linked manually to ${company.canonical_name}.` : 'Save an agreement now and link its company through entity review.'}</p></div><Link className="button-secondary" to="/live-review">Live resolution review <ArrowUpRight size={14}/></Link></div><LiveDataNotice/><div className="intake-columns"><DealForm key={companyId||'new'} onSave={save} initialValues={company?{counterparty_name:company.canonical_name,country:company.jurisdiction}:{}} successMessage="Deal saved to your private workspace."/><CSVIntake onSave={save} successMessage="Validated agreements saved to your private workspace."/></div><label className="form-field mt-7 max-w-xs"><span>Queue status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All agreements</option><option value="unresolved">Unresolved</option><option value="needs_review">Needs review</option><option value="resolved">Resolved manually</option></select></label><LiveDealQueue query={query}/><Link className="text-link mt-6" to="/">Return to your deal dashboard</Link></>;
}