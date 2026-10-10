import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import DealForm from '@/components/donna/DealForm';
import CSVIntake from '@/components/donna/CSVIntake';
import LiveDataNotice from '@/components/donna/live/LiveDataNotice';
import LiveDealQueue from '@/components/donna/live/LiveDealQueue';
import useLiveDeals from '@/components/donna/live/useLiveDeals';
import { liveRequest } from '@/components/donna/live/liveApi';
export default function LiveIntake() {
 const [status,setStatus]=useState('all');const query=useLiveDeals(status);const cache=useQueryClient();
 async function save(rows){await liveRequest({action:'createDeals',request_id:crypto.randomUUID(),rows});await cache.invalidateQueries({queryKey:['donna-live']});}
 return <><div className="page-heading"><div><div className="page-kicker">LIVE AGREEMENTS</div><h1>Deal intake</h1><p>Save the agreement first. Record the legal entity through a manual decision.</p></div><Link className="button-secondary" to="/live-review">Live resolution review <ArrowUpRight size={14}/></Link></div><LiveDataNotice/><div className="intake-columns"><DealForm onSave={save} successMessage="Agreement saved to your MongoDB book as unresolved. It is available in the live queue below."/><CSVIntake onSave={save} successMessage="Validated agreements saved to your MongoDB book as unresolved."/></div><label className="form-field mt-7 max-w-xs"><span>Queue status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All agreements</option><option value="unresolved">Unresolved</option><option value="needs_review">Needs review</option><option value="resolved">Resolved manually</option></select></label><LiveDealQueue query={query}/><Link className="text-link mt-6" to="/intake">Return to fictional demo intake</Link></>;
}