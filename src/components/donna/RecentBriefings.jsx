import React from 'react';
import { ArrowUpRight, ArrowRight, FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { companies } from '@/components/donna/demoData';
import { mockBriefings, mockClusters, mockSignals, sourceLabel } from '@/components/donna/contractFixtures';
import TierBadge from '@/components/donna/TierBadge';
// what_changed[0] may be absent and its signal_id may dangle, so every hop is guarded.
const fixtureItems = () => mockBriefings.slice(0,3).map(briefing=>{
 const company=companies.find(record=>record.id===briefing.company_id);
 const signal=mockSignals.find(record=>record.signal_id===briefing.what_changed[0]?.signal_id);
 const evidence=signal?.evidence?.[0];
 return {id:briefing.briefing_id,href:`/briefing/${briefing.company_id}`,company_name:company?.name||briefing.company_id,
  tier:mockClusters.find(record=>record.company_id===briefing.company_id)?.top_tier,
  date_label:`${briefing.generated_at.slice(8,10)} OCT`,title:briefing.headline,
  footer:evidence?`${sourceLabel(evidence.source)} · ${String(evidence.trust).toLowerCase()}`:null};
});
/**
 * @param {{items?:any[]|null,base?:string}} props items replaces the fixture lookup on the live path.
 */
export default function RecentBriefings({items=null,base='/'}){
 const latest=items||fixtureItems();
 return <section className="mt-8"><div className="section-heading"><div className="flex gap-2.5 items-center"><h2>Latest briefings</h2><span className="count-chip">{latest.length}</span></div><Link to={`${base}briefings`} className="text-link">View all briefings <ArrowRight size={14}/></Link></div><div className="briefing-grid">{latest.map(record=><Link to={record.href} className="briefing-card group" key={record.id}><div className="flex justify-between items-center"><TierBadge tier={record.tier}/><span className="text-[11px] text-[#96998f]">{record.date_label}</span></div><p className="mt-4 text-[11px] text-[#7b8074]">{record.company_name}</p><h3 className="mt-1.5 text-[15px] font-semibold leading-[1.5] tracking-[-.02em]">{record.title}</h3><div className="mt-auto pt-5 flex justify-between items-center">{record.footer?<span className="flex items-center gap-1.5 text-[10px] text-[#7f8575]"><FileCheck2 size={13}/>{record.footer}</span>:<span/>}<ArrowUpRight size={16} className="text-[#7c836a] group-hover:text-[#3e4931]"/></div></Link>)}</div></section>;
}
