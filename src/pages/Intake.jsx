import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import DealForm from '@/components/donna/DealForm';
import CSVIntake from '@/components/donna/CSVIntake';
import { useDemo } from '@/components/donna/DemoStore';
import { money } from '@/components/donna/demoData';
export default function Intake(){
 const {deals}=useDemo();
 return <><div className="page-heading"><div><div className="page-kicker">GROW YOUR BOOK</div><h1>Deal intake</h1><p>Start with an agreement. Entity resolution comes next.</p></div><Link to="/review" className="button-secondary">Resolution review <ArrowUpRight size={14}/></Link></div><div className="reading-note mb-6">Local demo only. New deals stay unresolved until the external resolution service is connected. Please use fictional data.</div><div className="intake-columns"><DealForm/><CSVIntake/></div><section className="mt-8"><div className="section-heading"><h2>Intake queue</h2><span className="count-chip">{deals.length}</span></div><div className="panel table-scroll"><table className="simple-table"><thead><tr><th>Counterparty</th><th>Country</th><th>Annual value</th><th>Watch terms</th><th>Resolution</th></tr></thead><tbody>{deals.map(d=><tr key={d.id}><td>{d.counterparty_name}</td><td>{d.country}</td><td>{money(d.annual_value_usd)}</td><td className="max-w-[280px]">{d.watch_terms||'Not supplied'}</td><td>{d.status==='needs_review'?<Link className="text-link" to="/review">Needs review <ArrowUpRight size={12}/></Link>:d.status==='resolved'?<Link className="text-link" to={`/company/${d.company_id}`}>Resolved manually <ArrowUpRight size={12}/></Link>:<span className="text-[#8b7858]">Unresolved · awaiting service</span>}</td></tr>)}</tbody></table>{!deals.length&&<div className="empty-state">Add a deal to start an intake queue.</div>}</div></section></>;
}