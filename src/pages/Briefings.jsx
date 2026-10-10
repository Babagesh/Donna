import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { companies, companySignals, dateLabel } from '@/components/donna/demoData';
import TierBadge from '@/components/donna/TierBadge';
import CoverageNote from '@/components/donna/CoverageNote';
export default function Briefings(){
 const [search,setSearch]=useState('');const rows=companies.filter(c=>c.tier&&c.name.toLowerCase().includes(search.toLowerCase()));
 return <><div className="page-heading"><div><div className="page-kicker">OBSERVED CHANGES</div><h1>Briefings</h1><p>What changed, why the agreement matters, and where to verify it.</p></div><div className="search-input"><Search size={14}/><input placeholder="Find a counterparty…" aria-label="Search briefings" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="briefing-list">{rows.map(c=><Link className="panel briefing-list-item" to={`/briefing/${c.id}`} key={c.id}><div><TierBadge tier={c.tier}/><span className="text-xs text-[#8a907d] ml-3">{dateLabel(companySignals(c.id)[0].date)}</span><p className="mt-4 text-xs text-[#7e856e]">{c.name}</p><h2 className="mt-1 text-lg font-medium">{c.signal}</h2><p className="text-xs text-[#8a907d] mt-3">{companySignals(c.id).length} cited observations · {c.checked} sources checked{c.gaps.length?` · ${c.gaps.length} coverage gap`:''}</p></div><ArrowUpRight size={20} className="text-[#929b80]"/></Link>)}</div>{!rows.length&&<div className="empty-state">No briefings match this counterparty.</div>}<div className="mt-6"><CoverageNote/></div></>;
}