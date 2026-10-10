import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { downloadText } from '@/components/donna/intakeUtils';
/**
 * @param {{record:any,base?:string,urlNote?:any}} props
 */
export default function EvidencePayload({record,base='/',urlNote=null}) {
 const [tab,setTab]=useState('excerpt');const {signal,snapshot,envelope,run,change}=record;
 const tabs=[['excerpt','Exact excerpt'],['snapshot','Snapshot'],...(envelope?[['envelope','Collector envelope']]:[]),...(run?[['run','Run record']]:[]),...(change?[['change','Change']]:[])];
 const payload={snapshot,envelope,run,change}[tab];
 return <section className="panel overflow-hidden"><div className="record-tabs" role="tablist" aria-label="Evidence record views">{tabs.map(([value,label])=><button role="tab" aria-selected={tab===value} key={value} onClick={()=>setTab(value)} className={tab===value?'selected':''}>{label}</button>)}</div><div className="p-6">{tab==='excerpt'?<><p className="eyebrow">PRESERVED SOURCE TEXT</p><blockquote className="evidence-excerpt">{snapshot.raw_excerpt||'The stored snapshot holds no excerpt text. The record is kept as collected; nothing is reconstructed here.'}</blockquote>{signal&&<div className="mt-6 pt-5 border-t"><p className="eyebrow">OBSERVATION SUPPORTED BY THIS RECORD</p><p className="text-sm text-muted-foreground leading-7 mt-3">{signal.summary_fact}</p><p className="text-xs text-muted-foreground mt-3">{signal.signal_id} · {signal.status} · {signal.confidence} confidence</p></div>}<div className="mt-6 pt-5 border-t"><p className="eyebrow">SOURCE URL</p><p className="font-mono text-xs break-all mt-3">{snapshot.source_url||'No source URL recorded'}</p><p className="text-[10px] text-muted-foreground mt-2">{urlNote||'Reserved .invalid domain: illustrative evidence only, not a real fetched page.'}</p></div>{change&&<div className="mt-5 text-xs text-muted-foreground">Compared against <Link to={`${base}evidence/${change.baseline_id}`} className="citation">{change.baseline_id}</Link>. Change kind: {change.kind}.</div>}</>:<><div className="flex items-center justify-between gap-3 mb-4"><span className="eyebrow">CONTRACT RECORD · JSON</span><button className="text-link" onClick={()=>downloadText(JSON.stringify(payload,null,2),`${tab}-${snapshot.snapshot_id}.json`,'application/json')}><Download size={12}/>Download</button></div><pre className="contract-json">{JSON.stringify(payload,null,2)}</pre></>}</div></section>;
}
