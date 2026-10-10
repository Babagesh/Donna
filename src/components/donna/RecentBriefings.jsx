import React from 'react';
import { ArrowUpRight, ArrowRight, FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { companies, signals } from '@/components/donna/demoData';
import TierBadge from '@/components/donna/TierBadge';
export default function RecentBriefings(){
 return <section className="mt-8"><div className="section-heading"><div className="flex gap-2.5 items-center"><h2>Latest briefings</h2><span className="count-chip">3</span></div><Link to="/briefings" className="text-link">View all briefings <ArrowRight size={14}/></Link></div><div className="briefing-grid">{signals.slice(0,3).map(s=>{const c=companies.find(c=>c.id===s.company_id);return <Link to={`/briefing/${c.id}`} className="briefing-card group" key={s.id}><div className="flex justify-between items-center"><TierBadge tier={s.tier}/><span className="text-[11px] text-[#96998f]">{s.date.slice(8)} OCT</span></div><p className="mt-4 text-[11px] text-[#7b8074]">{c.name}</p><h3 className="mt-1.5 text-[15px] font-semibold leading-[1.5] tracking-[-.02em]">{s.title}</h3><div className="mt-auto pt-5 flex justify-between items-center"><span className="flex items-center gap-1.5 text-[10px] text-[#7f8575]"><FileCheck2 size={13}/>{s.source} · {s.trust.toLowerCase()}</span><ArrowUpRight size={16} className="text-[#7c836a] group-hover:text-[#3e4931]"/></div></Link>;})}</div></section>;
}