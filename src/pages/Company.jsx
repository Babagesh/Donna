import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, FileText } from 'lucide-react';
import { companies, money } from '@/components/donna/demoData';
import { mockDeals, mockBriefings, mockCoverage, signalsFor } from '@/components/donna/contractFixtures';
import { useDemo } from '@/components/donna/DemoStore';
import TierBadge from '@/components/donna/TierBadge';
import SignalList from '@/components/donna/SignalList';
import AskDonna from '@/components/donna/AskDonna';
import SourceTable from '@/components/donna/SourceTable';
import CompanyProfile from '@/components/donna/CompanyProfile';
import EntityDetails from '@/components/donna/EntityDetails';
import LinkedDeals from '@/components/donna/LinkedDeals';
import ContractCoverage from '@/components/donna/ContractCoverage';
export default function Company(){
 const {id}=useParams();const {deals}=useDemo();const [tab,setTab]=useState('overview');
 const c=companies.find(c=>c.id===id);if(!c)return <div className="empty-state">Counterparty not found. <Link to="/">Return to book</Link></div>;
 const list=signalsFor(id);const linked=[...mockDeals.filter(d=>d.company_id===id),...deals.filter(d=>d.company_id===id&&d.status==='resolved')];const briefing=mockBriefings.find(b=>b.company_id===id);
 return <><Link to="/" className="back-link"><ArrowLeft size={14}/>Back to book</Link>
 <div className="page-heading mt-5"><div><div className="flex items-center gap-3 mb-3"><span className="company-monogram large">{c.initials}</span><TierBadge tier={c.tier}/><span className="text-xs text-muted-foreground">{c.country} · {c.sector}</span></div><h1>{c.name}</h1><p>{c.legal} · {c.registry}</p></div>{briefing&&<Link className="button-primary" to={`/briefing/${id}`}><FileText size={15}/>Read briefing <ArrowUpRight size={14}/></Link>}</div>
 <div className="detail-metrics"><div><small>ANNUAL EXPOSURE</small><strong>{money(linked.reduce((v,d)=>v+Number(d.annual_value_usd),0))}</strong></div><div><small>LINKED DEALS</small><strong>{linked.length}</strong></div><div><small>LATEST CHECK</small><strong className="!text-lg">10 Oct · {c.time} UTC</strong></div><div><small>OBSERVED SIGNALS</small><strong>{list.length}</strong></div></div>
 <div className="record-tabs mt-6" role="tablist" aria-label="Company sections">{[['overview','Overview'],['timeline','Signal timeline'],['sources','Sources & runs']].map(([value,label])=><button key={value} role="tab" aria-selected={tab===value} onClick={()=>setTab(value)} className={tab===value?'selected':''}>{label}</button>)}</div>
 <div className="detail-columns mt-6"><div>{tab==='overview'&&<CompanyProfile companyId={id}/>}<div className={tab==='overview'?'mt-6':''}>{tab!=='sources'&&<><div className="section-heading"><h2>Signal timeline</h2><span className="text-xs text-muted-foreground">Most recent first</span></div>{c.tier===3&&<div className="reading-note mb-4">Stored observations only. A single inferred signal does not produce a Tier 1 or Tier 2 briefing.</div>}{!list.length&&<p className="reading-note mb-4">No change observed across {mockCoverage[id].checked.length} sources since 3 Oct 2026. Coverage limits remain visible below.</p>}<SignalList signals={list}/></>}</div>
 <div id="coverage" className="mt-6 scroll-mt-5">{tab==='sources'&&<><div className="section-heading"><h2>Sources & collection runs</h2></div><SourceTable company={c}/></>}<div className="mt-4"><ContractCoverage coverage={mockCoverage[id]} asOf={`2026-10-10T${c.time}:00Z`}/></div></div></div>
 <aside><LinkedDeals deals={linked}/><div className="mt-5"><EntityDetails companyId={id}/></div></aside></div><div className="mt-7"><AskDonna companyId={id}/></div></>;
}