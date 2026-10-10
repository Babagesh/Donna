import React from 'react';
import { Link } from 'react-router-dom';
const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export default function LiveBookStats({ summary }) {
  const cards = [
    ['RECORDED COUNTERPARTIES', summary.counterparties, 'Manual identities, not registry verified'],
    ['AGREEMENTS', summary.agreements, `${summary.resolved} resolved · ${summary.needs_review} need review`],
    ['ANNUAL AGREEMENT VALUE', currency(summary.annual_value_usd), 'Gross total across all agreement classes, not net exposure'],
    ['AWAITING RESOLUTION', summary.unresolved + summary.needs_review, 'Unresolved agreements are not assigned to counterparties']
  ];
  return <div className="stats-grid mb-6">{cards.map(([label, value, detail], index) => <div className="stat-cell" key={label}><div className="eyebrow">{label}</div><div className="stat-value break-words">{value}</div><p className="stat-detail leading-5">{detail}</p>{index === 3 && <Link to="/live-review" className="text-link mt-3">Review agreements</Link>}</div>)}</div>;
}