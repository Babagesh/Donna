import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import { sourceLabel } from '@/components/donna/contractFixtures';
import { downloadText } from '@/components/donna/intakeUtils';
import EvidencePayload from '@/components/donna/EvidencePayload';
import { momentLabel } from '@/components/donna/live/liveShapes';
export default function LiveEvidence(){
 const {id}=useParams();
 // The id is a signal id or a snapshot id; `snap-<company>-<source>` resolves to the
 // newest snapshot stored for that pair, which is what the coverage matrix links to.
 const query=useQuery({queryKey:['donna-live','evidence',id],queryFn:()=>liveRequest({action:'getEvidence',id}),staleTime:15000,retry:false});
 const record=query.data||null;const snapshot=record?.snapshot||null;const signal=record?.signal||null;const run=record?.run||null;
 const entity=useQuery({queryKey:['donna-live','entity',snapshot?.company_id],queryFn:()=>liveRequest({action:'getCompany',company_id:snapshot.company_id}),enabled:Boolean(snapshot?.company_id),staleTime:15000,retry:false});
 if(query.isPending)return <p role="status" className="reading-note">Loading evidence record…</p>;
 if(query.isError)return <div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={()=>query.refetch()}>Retry</button></div>;
 if(!snapshot)return <div className="empty-state">No stored snapshot matches this reference{signal?`, although signal ${signal.signal_id} cites it. The evidence is missing from the record, which is a gap`:''}. <Link to="/live-book">Return to your companies</Link></div>;
 const companyName=entity.data?.company?.canonical_name||snapshot.company_id;
 const trust=signal?.evidence?.find(item=>item.snapshot_id===snapshot.snapshot_id)?.trust||'not recorded';
 return <><Link to={`/live-company/${encodeURIComponent(snapshot.company_id)}`} className="back-link"><ArrowLeft size={14}/>Back to {companyName}</Link>
  <div className="page-heading mt-6"><div><div className="page-kicker">SOURCE OF RECORD · STORED SNAPSHOT</div><h1>Evidence record</h1><p>{companyName} · {sourceLabel(snapshot.source)} · {snapshot.snapshot_id}</p></div><button className="button-secondary" onClick={()=>downloadText(JSON.stringify(record,null,2),snapshot.snapshot_id+'.json','application/json')}><Download size={14}/>Download record</button></div>
  <div className="reading-note">The snapshot is kept exactly as collected. Nothing on this page is rewritten or summarised by a model.</div>
  <div className="detail-columns mt-7"><EvidencePayload key={snapshot.snapshot_id} record={record} base="/live-" urlNote="The address recorded at collection time. The page may have changed since; only this snapshot is evidence."/>
   <aside className="panel p-6 h-fit"><h2 className="section-title">Collection provenance</h2><dl className="metadata-list"><dt>Source / trust</dt><dd>{sourceLabel(snapshot.source)} / {trust}</dd><dt>Fetched at</dt><dd>{momentLabel(snapshot.fetched_at)||'Not recorded'}</dd><dt>Snapshot ID</dt><dd className="font-mono">{snapshot.snapshot_id}</dd><dt>Content hash</dt><dd className="font-mono">{snapshot.content_hash||'Not recorded'}</dd><dt>Run ID / status</dt><dd className="font-mono">{run?`${run.run_id}`:'No collection run stored for this snapshot'}{run&&<><br/>{run.status}</>}</dd><dt>Sandbox</dt><dd className="font-mono">{run?.sandbox_id||'Not recorded'}</dd><dt>Batch</dt><dd className="font-mono">{run?.batch_id||'Not recorded'}</dd><dt>Credits spent</dt><dd>{run?.credits_spent??'Not recorded'}</dd><dt>Cache hit</dt><dd>{run?(run.cache_hit?'Yes':'No'):'Not recorded'}</dd>{run?.error&&<><dt>Run error</dt><dd>{run.error}</dd></>}</dl></aside></div></>;
}
