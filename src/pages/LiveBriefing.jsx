import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { liveRequest } from '@/components/donna/live/liveApi';
import TierBadge from '@/components/donna/TierBadge';
import BriefingBody from '@/components/donna/BriefingBody';
import ContractCoverage from '@/components/donna/ContractCoverage';
import CitationLinks from '@/components/donna/CitationLinks';
import { downloadText } from '@/components/donna/intakeUtils';
import { asTier, coverageOf, coverageSentence, momentLabel } from '@/components/donna/live/liveShapes';
export default function LiveBriefing(){
 const {id}=useParams();
 // The route accepts a briefing id or a company id, as the sample route does.
 const query=useQuery({queryKey:['donna-live','briefing',id],queryFn:async()=>{try{return await liveRequest({action:'getBriefing',briefing_id:id});}catch(error){if(/not found/i.test(error.message||''))return await liveRequest({action:'getBriefing',company_id:id});throw error;}},retry:false});
 const briefing=query.data?.briefing||null;const cluster=query.data?.cluster||null;const company=query.data?.company||null;
 const missing=query.isError&&/not found/i.test(query.error?.message||'');
 // Citations are resolved against the stored signals: a line whose signal is absent is not shown.
 const signals=useQuery({queryKey:['donna-live','signals',briefing?.company_id],queryFn:()=>liveRequest({action:'listSignals',company_id:briefing.company_id}),enabled:Boolean(briefing?.company_id),staleTime:15000,retry:false});
 const entity=useQuery({queryKey:['donna-live','company',id],queryFn:()=>liveRequest({action:'getCompany',company_id:id}),enabled:missing,retry:false});
 if(query.isPending)return <div className="reading-width" role="status"><p className="reading-note">Loading briefing…</p></div>;
 if(missing)return <div className="reading-width"><Link to={`/live-company/${encodeURIComponent(id)}`} className="back-link"><ArrowLeft size={14}/>Company record</Link><div className="page-heading mt-6"><div><h1>No change briefing issued</h1><p>Stored observations remain available on the company timeline; no alert is inferred from missing narration.</p></div></div><p className="reading-note">{coverageSentence(coverageOf(entity.data?.coverage),entity.data?.company?.last_checked_at)}</p>{entity.data&&<div className="mt-6"><ContractCoverage coverage={coverageOf(entity.data.coverage)} asOf={entity.data.company?.last_checked_at}/></div>}</div>;
 if(query.isError)return <div className="reading-width"><div role="alert" className="form-error">{query.error.message}<button className="text-link ml-3" onClick={()=>query.refetch()}>Retry</button></div></div>;
 const signalItems=signals.data?.items||null;
 const generated=momentLabel(briefing.generated_at);
 const windowFrom=cluster?.window?.from||'start not recorded';const windowTo=cluster?.window?.to||'end not recorded';
 return <div className="reading-width"><Link to={`/live-company/${encodeURIComponent(briefing.company_id)}`} className="back-link"><ArrowLeft size={14}/>{company?.canonical_name||'Company record'}</Link>
  <div className="page-heading mt-7"><div><div className="flex items-center gap-3 mb-5"><TierBadge tier={asTier(cluster?.top_tier)}/><span className="eyebrow">{briefing.mode==='profile'?'STARTING PROFILE · NOT AN ALERT':'BRIEFING'}{generated?` · ${generated}`:''}</span></div><h1 className="!leading-[1.25]">{briefing.headline}</h1>{signalItems&&<div className="mt-3"><CitationLinks ids={briefing.citations?.headline||[]} companyId={briefing.company_id} signals={signalItems} base="/live-"/></div>}<p>{company?.canonical_name||briefing.company_id} · {windowFrom} – {windowTo} · {briefing.briefing_id}</p></div><button className="button-secondary" aria-label="Download briefing contract" onClick={()=>downloadText(JSON.stringify(briefing,null,2),`${briefing.briefing_id}.json`,'application/json')}><Download size={14}/>Export</button></div>
  {signals.isPending?<p role="status" className="reading-note">Resolving citations against stored signals…</p>
   :signals.isError?<div role="alert" className="form-error">Briefing lines are withheld: the stored signals could not be read ({signals.error.message}) so their citations cannot be resolved. That is a gap, not a finding that nothing changed.<button className="text-link ml-3" onClick={()=>signals.refetch()}>Retry</button></div>
   :<BriefingBody briefing={briefing} cluster={cluster} signals={signalItems||[]} base="/live-" note="Narration is read from the stored briefing record. Each observation links to the signal and snapshot it came from; an observation without a resolvable citation is not shown."/>}
  {Array.isArray(briefing.sections)&&Boolean(briefing.sections.length)&&<section className="panel p-6 mt-6"><h2 className="section-title">Starting state and known gaps</h2><div className="profile-sections">{briefing.sections.map((section,index)=><div key={section.title||index}><h3>{section.title}</h3><p>{section.text}{section.gap&&<span className="gap-label ml-2">Not observed</span>}{section.signal_id&&signalItems&&<CitationLinks ids={[section.signal_id]} companyId={briefing.company_id} signals={signalItems} base="/live-"/>}</p></div>)}</div></section>}
  <div className="mt-6"><ContractCoverage coverage={coverageOf(briefing.coverage)} asOf={briefing.generated_at}/></div>
  <p className="reading-note mt-4">{coverageSentence(coverageOf(briefing.coverage),briefing.generated_at)}</p>
  <Link to={`/live-company/${encodeURIComponent(briefing.company_id)}`} className="button-secondary mt-6">Open full company record <ArrowUpRight size={14}/></Link></div>;
}
