import React from 'react';
import { Building2, Wallet, Files, ScanLine, ArrowUpRight } from 'lucide-react';
import { money } from '@/components/donna/demoData';
import useBookData from '@/components/donna/useBookData';
import { Link } from 'react-router-dom';
export default function BookStats(){
 const companies=useBookData();
 const items=[{label:'COUNTERPARTIES',value:companies.length,detail:'Across 8 industry groups',icon:Building2},{label:'ANNUAL EXPOSURE',value:money(companies.reduce((s,c)=>s+c.exposure,0)),detail:'Total linked deal value · USD',icon:Wallet},{label:'ACTIVE DEALS',value:companies.reduce((s,c)=>s+c.deals,0),detail:'Across your monitored book',icon:Files},{label:'COVERAGE GAPS',value:companies.filter(c=>c.gaps.length).length.toString().padStart(2,'0'),detail:'Sources need attention',icon:ScanLine,link:'/coverage'}];
 return <div className="stats-grid">{items.map(({label,value,detail,icon:Icon,link})=><div className="stat-cell" key={label}><div className="flex justify-between items-center"><span className="eyebrow">{label}</span><Icon size={16} className="text-[#95998c]"/></div><div className="stat-value">{value}</div>{link?<Link to={link} className="stat-detail text-[#7b6747]">{detail}<ArrowUpRight size={13}/></Link>:<div className="stat-detail">{detail}</div>}</div>)}</div>;
}