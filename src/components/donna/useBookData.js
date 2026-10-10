import { companies } from '@/components/donna/demoData';
import { mockCompanies, mockDeals, mockClusters, mockCoverage, sourceLabel, signalsFor, signalTitle } from '@/components/donna/contractFixtures';
import { useDemo } from '@/components/donna/DemoStore';
export default function useBookData(){
 const {deals}=useDemo();
 return mockCompanies.map(record=>{
  const company=companies.find(c=>c.id===record.company_id);
  const linked=[...mockDeals,...deals.filter(d=>d.status==='resolved')].filter(d=>d.company_id===record.company_id);
  const cluster=mockClusters.find(c=>c.company_id===record.company_id);const observed=signalsFor(record.company_id);const coverage=mockCoverage[record.company_id];
  return {...company,company_id:record.company_id,legal:record.canonical_name,registry:record.registry_id,deals:linked.length,exposure:linked.reduce((total,deal)=>total+Number(deal.annual_value_usd),0),tier:cluster?.top_tier||(observed.length?3:0),weight:cluster?.exposure.top_weight||company.weight,signal:observed.length?signalTitle(observed[0].signal_id):'No change observed',checked:coverage.checked.length,gaps:coverage.failed.map(sourceLabel)};
 });
}