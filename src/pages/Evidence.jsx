import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { companies } from '@/components/donna/demoData';
import { resolveEvidence, sourceLabel, sourceCatalog } from '@/components/donna/contractFixtures';
import { downloadText } from '@/components/donna/intakeUtils';
import EvidencePayload from '@/components/donna/EvidencePayload';
export default function Evidence(){
 const {id}=useParams();const record=resolveEvidence(id);const {signal,snapshot,run}=record;
 if(!snapshot)return <div className="empty-state">Evidence not found. <Link to="/">Return to book</Link></div>;
 const company=companies.find(c=>c.id===snapshot.company_id);
 return <><Link to={`/company/${company.id}`} className="back-link"><ArrowLeft size={14}/>Back to {company.name}</Link>
 <div className="page-heading mt-6"><div><div className="page-kicker">SOURCE OF RECORD · SAMPLE EVIDENCE</div><h1>Evidence record</h1><p>{company.name} · {sourceLabel(snapshot.source)} · {snapshot.snapshot_id}</p></div><button className="button-secondary" onClick={()=>downloadText(JSON.stringify({demo:true,...record},null,2),snapshot.snapshot_id+'.json','application/json')}><Download size={14}/>Download record</button></div>
 <div className="reading-note">Fictional evidence with complete contract records. No Bright Data request was made and no real company claim is implied.</div>
 <div className="detail-columns mt-7"><EvidencePayload key={snapshot.snapshot_id} record={record}/><aside className="panel p-6 h-fit"><h2 className="section-title">Collection provenance</h2><dl className="metadata-list"><dt>Source / trust</dt><dd>{sourceLabel(snapshot.source)} / {signal?.evidence.find(e=>e.snapshot_id===snapshot.snapshot_id)?.trust||sourceCatalog.find(s=>s.id===snapshot.source)?.trust}</dd><dt>Simulated Bright Data fetch</dt><dd>{new Date(snapshot.fetched_at).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</dd><dt>Snapshot ID</dt><dd className="font-mono">{snapshot.snapshot_id}</dd><dt>Content hash</dt><dd className="font-mono">{snapshot.content_hash}<br/><small>Illustrative fixture identifier</small></dd><dt>Run ID / status</dt><dd className="font-mono">{run.run_id}<br/>{run.status}</dd><dt>Daytona sandbox</dt><dd className="font-mono">{run.sandbox_id}</dd><dt>Batch</dt><dd className="font-mono">{run.batch_id}</dd><dt>Credits spent</dt><dd>{run.credits_spent} · No live collector connected</dd><dt>Cache hit</dt><dd>{run.cache_hit?'Yes':'No'}</dd></dl></aside></div></>;
}