import React, { createContext, useContext, useState } from 'react';
import { mockCompanies } from '@/components/donna/contractFixtures';
const Context = createContext(null);
const initial = [{id:'demo-review',counterparty_name:'Atlas Medical',country:'US',deal_class:'they_pay_us',annual_value_usd:360000,start_date:'2026-01-01',end_date:'2027-01-01',status:'needs_review',watch_terms:'litigation_cap_usd: 500000',candidates:['atlas']}];
export default function DemoStore({children}) {
 const [deals,setDeals] = useState(()=>(JSON.parse(localStorage.getItem('donna-demo-deals')||'null')||initial).map(d=>({...d,deal_id:d.deal_id||d.id})));
 const save = next => {localStorage.setItem('donna-demo-deals',JSON.stringify(next));setDeals(next);};
 const addDeals = rows => save([...deals,...rows.map(d=>{const id=crypto.randomUUID();return {...d,id,deal_id:id,status:'unresolved'};})]);
 const resolve = (id,company_id) => save(deals.map(d=>d.id===id?{...d,company_id,status:'resolved',resolution:{confidence:null,reason:'Manually selected from mock candidates; no external verification performed.',resolved_by:'demo_reviewer',candidates_seen:d.candidates||[]},resolution_reason:'Manually selected by the demo reviewer.'}:d));
 const previewResolution = id => save(deals.map(d=>{if(d.id!==id)return d;const candidates=mockCompanies.filter(c=>c.jurisdiction===d.country).sort((a,b)=>Number(b.aliases.some(n=>n.toLowerCase()===d.counterparty_name.toLowerCase()))-Number(a.aliases.some(n=>n.toLowerCase()===d.counterparty_name.toLowerCase()))).slice(0,3);return {...d,status:'needs_review',candidates:candidates.map(c=>c.company_id),resolution:{confidence:null,reason:'Mock candidates from the selected country, not a live entity match. Review manually.',resolved_by:null,candidates_seen:candidates}};}));
 const keepUnresolved = id => save(deals.map(d=>d.id===id?{...d,status:'unresolved',resolution_reason:'No mock candidate selected; original name retained.'}:d));
 return <Context.Provider value={{deals,addDeals,resolve,previewResolution,keepUnresolved}}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);