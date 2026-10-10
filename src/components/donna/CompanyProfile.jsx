import React from 'react';
import { FileText } from 'lucide-react';
import { mockProfiles } from '@/components/donna/contractFixtures';
import CitationLinks from '@/components/donna/CitationLinks';
export default function CompanyProfile({companyId}) {
 const profile=mockProfiles.find(p=>p.company_id===companyId);
 return <section className="panel p-6"><div className="section-heading"><h2 className="flex gap-2 items-center"><FileText size={15}/>Behaviour profile</h2><span className="count-chip">BASELINE · 28 SEP</span></div><p className="text-xs text-muted-foreground leading-6 mb-5">The first run establishes a profile, not a change alert. Historical behaviour cannot be inferred from a single snapshot.</p><div className="profile-sections">{profile.sections.map(section=><div key={section.title}><h3>{section.title}</h3><p>{section.text}{section.signal_id&&<CitationLinks ids={[section.signal_id]} companyId={companyId}/>}</p></div>)}</div><p className="text-[10px] text-muted-foreground border-t pt-4 mt-5">{profile.confidence_note}</p></section>;
}