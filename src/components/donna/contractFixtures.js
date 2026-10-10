import { companies as companySeeds, signals as observationSeeds, notCovered, money } from '@/components/donna/demoData';

// Fixture-only repository boundary. No network, scraping, classification, or narration runs here.
// Records keep the architecture's field names. Display-only metadata lives beside them.
export const sourceCatalog = [
 {id:'registry',label:'Company registry',trust:'primary'}, {id:'court',label:'Court records',trust:'primary'},
 {id:'regulator',label:'Regulator records',trust:'primary'}, {id:'layoffs',label:'Layoff notices',trust:'primary'},
 {id:'news',label:'News & press',trust:'reported'}, {id:'executives',label:'Executive moves',trust:'reported'},
 {id:'jobs',label:'Job postings',trust:'inferred'}, {id:'domain',label:'Domain & site',trust:'inferred'},
];
export const sourceLabel = id => sourceCatalog.find(s=>s.id===id)?.label || id;
export const sourceId = label => sourceCatalog.find(s=>s.label===label)?.id || label;
const fetchedAt = c => `2026-10-10T${c.time}:00Z`;
const sampleUrl = (company,source,suffix='latest') => `https://donna-sample.invalid/${source}/${company}/${suffix}`;
export const mockCompanies = companySeeds.map(c=>({
 company_id:c.id, canonical_name:c.legal, registry_id:c.registry, jurisdiction:c.country,
 domains:[`${c.id}.invalid`], aliases:[c.name], officers:c.id==='nordvale'?[{name:'Jane Doe',role:'CFO',status:'departed',until:'2026-10-08'}]:[],
 related_entities:c.id==='northstar'?[{name:'Alder Holdings LLC',relation:'parent',monitored:false}]:[],
 resolution:{confidence:0.98,reason:'Sample legal name and jurisdiction match the sample registration. This is a fixture, not a live lookup.',resolved_by:'demo_fixture',candidates_seen:[{canonical_name:c.legal,registry_id:c.registry,jurisdiction:c.country}]},
 last_checked_at:fetchedAt(c), monitoring_since:'2026-09-28',
}));
export const mockDeals = companySeeds.flatMap((c,index)=>Array.from({length:c.deals},(_,i)=>({
 deal_id:`dl-${c.id}-${i+1}`,company_id:c.id,counterparty_name:c.name,country:c.country,
 deal_class:index===1?'we_pay_them':index===4?'tied':'they_pay_us',annual_value_usd:c.exposure/c.deals,
 start_date:'2024-03-01',end_date:'2027-02-28',notice_days:90,share_pct:c.id==='nordvale'?14:undefined,
 substitutability:c.id==='northstar'?'hard':'quarter',owner_email:'analyst@donna-sample.invalid',watch_terms:c.watch,status:'resolved',
})));
export const mockRuns = companySeeds.flatMap(c=>sourceCatalog.map(source=>({
 run_id:`run-${c.id}-${source.id}`,batch_id:`batch-${c.id}-2026-10-10`,company_id:c.id,source:source.id,
 started_at:`2026-10-10T${c.time}:00Z`,ended_at:`2026-10-10T${c.time}:12Z`,
 status:c.gaps.includes(source.label)?'failed':(source.id==='registry'||observationSeeds.some(s=>s.company_id===c.id&&sourceId(s.source)===source.id)?'ok':'empty'),
 error:c.gaps.includes(source.label)?'SAMPLE_TIMEOUT: illustrative source fetch exceeded its time limit.':null,
 credits_spent:0,sandbox_id:`sandbox-demo-${c.id}-${source.id}`,cache_hit:false,demo:true,
})));
export const mockCoverage = Object.fromEntries(companySeeds.map(c=>[c.id,{
 checked:mockRuns.filter(r=>r.company_id===c.id&&r.status!=='failed').map(r=>r.source),
 failed:mockRuns.filter(r=>r.company_id===c.id&&r.status==='failed').map(r=>r.source),not_covered:[...notCovered],
}]));
const itemFor = s => ({key:`${s.type}:${s.id}`,type:s.type,summary:s.fact,...(s.id==='sig-003'?{name:'Jane Doe',role:'CFO'}:{}),...(s.id==='sig-006'?{open_roles:12}:{}),...(s.type==='litigation'?{amount_usd:s.id==='sig-004'?620000:540000}:{})});
export const mockEnvelopes = mockRuns.map(run=>{
 const c=companySeeds.find(c=>c.id===run.company_id);
 const sourceItems=observationSeeds.filter(s=>s.company_id===c.id&&sourceId(s.source)===run.source);
 const baselineText=run.source==='registry'?`Sample registry entry: ${c.legal}. Registration: ${c.registry}. Jurisdiction: ${c.country}.`:`Sample ${sourceLabel(run.source).toLowerCase()} check for ${c.legal}. No additional items returned.`;
 return {company_id:c.id,source:run.source,fetched_at:run.started_at,run_id:run.run_id,ok:run.status!=='failed',error:run.error,
 items:run.status==='failed'?[]:sourceItems.length?sourceItems.map(itemFor):run.source==='registry'?[{key:`entity:${c.registry}`,type:'entity',name:c.legal,registry_id:c.registry}]:[],
 raw_excerpt:run.status==='failed'?'':sourceItems.length?sourceItems.map(s=>s.excerpt).join('\n\n'):baselineText,source_url:sampleUrl(c.id,run.source),credits_spent:0};
});
export const mockSnapshots = mockEnvelopes.filter(e=>e.ok).map(e=>({
 snapshot_id:`snap-${e.company_id}-${e.source}`,company_id:e.company_id,source:e.source,fetched_at:e.fetched_at,run_id:e.run_id,
 items:e.items,raw_excerpt:e.raw_excerpt,source_url:e.source_url,content_hash:`fixture-${e.company_id}-${e.source}-v2`,ok:true,
}));
const baselineSnapshots = companySeeds.map(c=>({snapshot_id:`snap-profile-${c.id}`,company_id:c.id,source:'registry',fetched_at:'2026-09-28T12:00:00Z',run_id:`run-profile-${c.id}`,items:[{key:`entity:${c.registry}`,type:'entity',name:c.legal,registry_id:c.registry}],raw_excerpt:`Sample registry entry, 28 September 2026. Registered entity: ${c.legal}. Registration number: ${c.registry}. Jurisdiction: ${c.country}.`,source_url:sampleUrl(c.id,'registry','baseline'),content_hash:`fixture-${c.id}-registry-v1`,ok:true}));
mockSnapshots.push(...baselineSnapshots);
mockRuns.push(...companySeeds.map(c=>({run_id:`run-profile-${c.id}`,batch_id:`batch-profile-${c.id}`,company_id:c.id,source:'registry',started_at:'2026-09-28T12:00:00Z',ended_at:'2026-09-28T12:00:12Z',status:'ok',error:null,credits_spent:0,sandbox_id:`sandbox-demo-profile-${c.id}`,cache_hit:false,demo:true})));
export const mockChanges = observationSeeds.map(s=>{
 const source=sourceId(s.source);const baseline_id=`snap-before-${s.id}`;
 const previous=s.id==='sig-003'?{key:`${s.type}:${s.id}`,type:'officer',name:'Jane Doe',role:'CFO'}:s.id==='sig-006'?{...itemFor(s),open_roles:28,summary:'28 open roles in the previous snapshot.'}:null;
 const baseline={snapshot_id:baseline_id,company_id:s.company_id,source,fetched_at:'2026-09-28T12:00:00Z',run_id:`run-before-${s.id}`,items:previous?[previous]:[],raw_excerpt:previous?(s.id==='sig-003'?'Sample registry officer list, 28 September 2026: Jane Doe, Chief Financial Officer.':'Sample careers-page snapshot, 28 September 2026: 28 open roles.'):`Sample baseline for ${sourceLabel(source)}: the subsequently observed item was not present in this sample snapshot.`,source_url:sampleUrl(s.company_id,source,baseline_id),content_hash:`fixture-${s.id}-v1`,ok:true};
 mockSnapshots.push(baseline);
 mockRuns.push({run_id:baseline.run_id,batch_id:'batch-baseline',company_id:s.company_id,source,started_at:baseline.fetched_at,ended_at:'2026-09-28T12:00:12Z',status:'ok',error:null,credits_spent:0,sandbox_id:`sandbox-demo-before-${s.id}`,cache_hit:false,demo:true});
 return {company_id:s.company_id,source,kind:s.id==='sig-003'?'removed':s.id==='sig-006'?'altered':'added',item:itemFor(s),previous,snapshot_id:`snap-${s.company_id}-${source}`,baseline_id,detected_at:mockCompanies.find(c=>c.company_id===s.company_id).last_checked_at};
});
export const mockSignals = observationSeeds.map(s=>({
 signal_id:s.id,company_id:s.company_id,type:s.type,tier:s.tier,confidence:s.confidence.toLowerCase(),status:s.trust==='Inferred'?'inferred':'confirmed',
 evidence:[{snapshot_id:`snap-${s.company_id}-${sourceId(s.source)}`,source:sourceId(s.source),trust:s.trust.toLowerCase(),excerpt:s.excerpt,url:sampleUrl(s.company_id,sourceId(s.source))}],
 first_seen:s.date,summary_fact:s.fact,
}));
mockSignals.push(...baselineSnapshots.map(s=>({signal_id:`sig-profile-${s.company_id}`,company_id:s.company_id,type:'baseline_identity',tier:0,confidence:'high',status:'baseline',evidence:[{snapshot_id:s.snapshot_id,source:s.source,trust:'primary',excerpt:s.raw_excerpt,url:s.source_url}],first_seen:'2026-09-28',summary_fact:s.raw_excerpt})));
export const signalTitle = id => observationSeeds.find(s=>s.id===id)?.title || 'Starting registry record';
export const signalsFor = id => mockSignals.filter(s=>s.company_id===id&&s.status!=='baseline').sort((a,b)=>b.first_seen.localeCompare(a.first_seen));
export const mockClusters = companySeeds.filter(c=>c.tier===1||c.tier===2).map(c=>({
 cluster_id:`cl-${c.id}`,company_id:c.id,mode:'briefing',window:{from:'2026-09-26',to:'2026-10-10'},top_tier:c.tier,verify_with_counterparty:c.tier===1,
 signals:signalsFor(c.id).filter(s=>s.tier<3).map(s=>s.signal_id),
 deals:mockDeals.filter(d=>d.company_id===c.id).map(d=>({deal_id:d.deal_id,class:d.deal_class,annual_value_usd:d.annual_value_usd,share_pct:d.share_pct,notice_days:d.notice_days,days_to_renewal:141,exposure_weight:c.weight})),
 exposure:{top_weight:c.weight,annual_value_usd:c.exposure},coverage:mockCoverage[c.id],fingerprint:`fixture-cluster-${c.id}-v1`,
}));
export const mockBriefings = mockClusters.map(cluster=>{
 const c=companySeeds.find(c=>c.id===cluster.company_id);const list=cluster.signals.map(id=>mockSignals.find(s=>s.signal_id===id));
 const matched=observationSeeds.find(s=>s.company_id===c.id&&s.verify);
 return {briefing_id:`br-${c.id}`,company_id:c.id,mode:'briefing',headline:c.signal,what_changed:list.map(s=>({text:s.summary_fact,signal_id:s.signal_id})),
 why_it_matters:`These observations relate to ${cluster.deals.length} linked agreements with ${money(c.exposure)} total annual value. The sample notice period is 90 days, with 141 days to the stated end date. Worth discussing the observed changes in the context of the agreement.`,
 verify:cluster.verify_with_counterparty?matched.verify:null,confidence_note:'The cited observations come from primary sample records. A recorded claim or notice is not a determination of wrongdoing.',coverage:cluster.coverage,generated_at:`2026-10-10T${c.time}:30Z`,
 // Additional citation map covers facts outside what_changed without changing its contract.
 citations:{headline:list.slice(0,1).map(s=>s.signal_id),why_it_matters:list.map(s=>s.signal_id),deal_context:cluster.deals.map(d=>d.deal_id),verify:matched?[matched.id]:[],confidence_note:list.map(s=>s.signal_id)},
 narration_status:c.id==='cascadia'?'fallback':'available',
 };
});
export const mockProfiles = companySeeds.map(c=>({
 briefing_id:`profile-${c.id}`,company_id:c.id,mode:'profile',headline:`Starting profile: ${c.name}`,
 what_changed:[{text:`The starting registry snapshot identifies ${c.legal}, registration ${c.registry}, in ${c.country}.`,signal_id:`sig-profile-${c.id}`}],
 why_it_matters:'This is a starting record, not evidence of historical behaviour or an assessment of health.',verify:null,confidence_note:'Baseline observations establish the starting state; they are not new-change alerts.',coverage:{checked:['registry'],failed:[],not_covered:[...notCovered,'Historical behaviour before 28 Sep 2026']},generated_at:'2026-09-28T12:01:00Z',
 sections:[{title:'Starting state',text:`The starting registry snapshot identifies ${c.legal}, registration ${c.registry}, in ${c.country}.`,signal_id:`sig-profile-${c.id}`},{title:'Leadership history',text:'Long-term officer churn is not observed in the available sample history.',gap:true},{title:'Counterparty behaviour',text:'Payment behaviour and relationship sentiment are not covered.',gap:true},{title:'Before the next conversation',text:'Consider verifying the legal entity and any relevant watched terms directly.',gap:true}],
}));
export const resolveEvidence = id => {
 const signal=mockSignals.find(s=>s.signal_id===id);
 const snapshot=mockSnapshots.find(s=>s.snapshot_id===(signal?.evidence[0]?.snapshot_id||id));
 const parentSignal=signal||mockSignals.find(s=>s.evidence.some(e=>e.snapshot_id===id));
 return {signal:parentSignal,snapshot,run:mockRuns.find(r=>r.run_id===snapshot?.run_id),change:mockChanges.find(c=>c.snapshot_id===snapshot?.snapshot_id),envelope:mockEnvelopes.find(e=>e.run_id===snapshot?.run_id)};
};
export const allContracts = () => ({companies:mockCompanies,deals:mockDeals,collector_envelopes:mockEnvelopes,collector_runs:mockRuns,snapshots:mockSnapshots,changes:mockChanges,signals:mockSignals,clusters:mockClusters,briefings:[...mockBriefings,...mockProfiles]});