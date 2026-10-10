import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, FileText } from 'lucide-react';
import TierBadge from '@/components/donna/TierBadge';
import { dateLabel } from '@/components/donna/demoData';
import { signalTitle, sourceLabel } from '@/components/donna/contractFixtures';
export default function SignalList({signals}){
 return <div className="panel">{signals.length?signals.map(record=>{const s={...record,id:record.signal_id,date:record.first_seen,title:signalTitle(record.signal_id),fact:record.summary_fact,source:record.evidence.map(e=>sourceLabel(e.source)).join(' + '),trust:record.evidence.map(e=>e.trust).join(' + ')};return <article key={s.id} className="signal-entry"><div className="flex flex-wrap gap-3 items-center"><TierBadge tier={s.tier}/><span className="text-xs text-[#8b9081]">{dateLabel(s.date)}</span><span className="ml-auto text-[10px] text-[#79806c]">{s.status} · {s.confidence} confidence</span></div><h3 className="mt-3 font-semibold text-sm">{s.title}</h3><p className="text-[13px] leading-6 text-[#777d6d] mt-2">{s.fact} <Link to={`/evidence/${s.id}`} className="citation">[{s.id}]</Link></p><Link to={`/evidence/${s.id}`} className="text-link mt-3 inline-flex"><FileText size={13}/>{s.source} · {s.trust} <ArrowUpRight size={12}/></Link></article>;}):<div className="p-6 text-sm text-[#7b826f]">No change signals in the sample period. See source coverage below; absence of a signal is not a conclusion.</div>}</div>;
}