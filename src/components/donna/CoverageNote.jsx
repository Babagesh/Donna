import React from 'react';
import { Info } from 'lucide-react';
import { notCovered } from '@/components/donna/demoData';
export default function CoverageNote({company,compact=false}) {
 return <div className={`coverage-note ${compact?'p-4':'p-5'}`}><Info size={16} className="mt-0.5 shrink-0 text-[#777b66]"/><div><h3 className="text-[12px] font-semibold">Coverage is not a verdict.</h3><p className="mt-1 text-[12px] leading-5 text-[#76796f]">{company?(company.tier===0?`No change observed across ${company.checked} sources since 3 Oct 2026. `:`${company.checked} sources checked on 10 Oct 2026 at ${company.time} UTC. `):'Donna reports observed changes, not company health. '}{company?.gaps.length>0&&`Not checked: ${company.gaps.join(', ')}. `}Not covered: {notCovered.join(', ').toLowerCase()}.</p></div></div>;
}