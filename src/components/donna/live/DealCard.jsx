import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { money } from '@/components/donna/demoData';
const labels = { they_pay_us: 'Receivable', we_pay_them: 'Payable', tied: 'Compliance relationship' };
export default function DealCard({ deal }) {
  return <Link to={`/deals/${encodeURIComponent(deal.deal_id)}`} className="deal-card panel p-5 flex flex-col gap-5 hover:border-primary focus-visible:outline-ring">
    <div className="flex items-start justify-between gap-3"><span className="rounded px-2 py-1 text-[10px] font-medium bg-secondary text-secondary-foreground">{labels[deal.deal_class]}</span><ArrowUpRight className="text-primary shrink-0" size={17}/></div>
    <div><h2 className="text-base font-semibold leading-6 break-words">{deal.title || `${deal.counterparty_name} agreement`}</h2><p className="text-xs text-muted-foreground mt-2 break-words">{deal.counterparty_name} · {deal.country}</p></div>
    <div className="mt-auto"><p className="text-2xl font-medium tracking-tight">{money(deal.annual_value_usd)}<span className="text-xs text-muted-foreground font-normal ml-2">/ year</span></p><div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-3"><CalendarDays size={13}/>{deal.start_date} → {deal.end_date}</div></div>
    <div className="border-t border-border pt-3 text-[10px] text-muted-foreground flex flex-wrap justify-between gap-2"><span>{deal.status === 'resolved' ? 'Company linked manually' : deal.status === 'needs_review' ? 'Entity review required' : 'No company linked yet'}</span><span>View deal</span></div>
  </Link>;
}