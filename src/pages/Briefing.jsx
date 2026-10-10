import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Download } from 'lucide-react';
import { companies } from '@/components/donna/demoData';
import { mockBriefings, mockClusters, mockCoverage } from '@/components/donna/contractFixtures';
import TierBadge from '@/components/donna/TierBadge';
import BriefingBody from '@/components/donna/BriefingBody';
import ContractCoverage from '@/components/donna/ContractCoverage';
import CitationLinks from '@/components/donna/CitationLinks';
import { downloadText } from '@/components/donna/intakeUtils';
export default function Briefing(){
 const {id}=useParams();const briefing=mockBriefings.find(b=>b.company_id===id||b.briefing_id===id);const c=companies.find(c=>c.id===(briefing?.company_id||id));
 if(!c)return <div className="empty-state">Briefing not found. <Link to="/briefings">View briefings</Link></div>;
 if(!briefing)return <div className="reading-width"><Link to={`/company/${c.id}`} className="back-link"><ArrowLeft size={14}/>Company record</Link><div className="page-heading mt-6"><div><h1>No change briefing issued</h1><p>Stored observations remain available on the company timeline; no alert is inferred from missing narration.</p></div></div><ContractCoverage coverage={mockCoverage[c.id]}/></div>;
 const cluster=mockClusters.find(cl=>cl.company_id===c.id);
 return <div className="reading-width"><Link to={`/company/${c.id}`} className="back-link"><ArrowLeft size={14}/>{c.name}</Link>
 <div className="page-heading mt-7"><div><div className="flex items-center gap-3 mb-5"><TierBadge tier={cluster.top_tier}/><span className="eyebrow">BRIEFING · 10 OCTOBER 2026</span></div><h1 className="!leading-[1.25]">{briefing.headline}</h1><div className="mt-3"><CitationLinks ids={briefing.citations.headline} companyId={c.id}/></div><p>{c.name} · {cluster.window.from} – {cluster.window.to} · {briefing.briefing_id}</p></div><button className="button-secondary" aria-label="Download briefing contract" onClick={()=>downloadText(JSON.stringify(briefing,null,2),`${briefing.briefing_id}.json`,'application/json')}><Download size={14}/>Export</button></div>
 <BriefingBody briefing={briefing} cluster={cluster}/><div className="mt-6"><ContractCoverage coverage={briefing.coverage} asOf={briefing.generated_at}/></div><Link to={`/company/${c.id}`} className="button-secondary mt-6">Open full company record <ArrowUpRight size={14}/></Link></div>;
}