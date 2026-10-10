import { companies } from '@/components/donna/demoData';
import { useDemo } from '@/components/donna/DemoStore';
export default function useBookData(){
 const {deals}=useDemo();
 return companies.map(company=>{
  const linked=deals.filter(deal=>deal.status==='resolved'&&deal.company_id===company.id);
  return {...company,deals:company.deals+linked.length,exposure:company.exposure+linked.reduce((total,deal)=>total+Number(deal.annual_value_usd),0)};
 });
}