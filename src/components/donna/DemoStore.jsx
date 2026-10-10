import React, { createContext, useContext, useState } from 'react';
const Context = createContext(null);
const initial = [{id:'demo-review',counterparty_name:'Atlas Medical',country:'US',deal_class:'they_pay_us',annual_value_usd:360000,start_date:'2026-01-01',end_date:'2027-01-01',status:'needs_review',watch_terms:'litigation_cap_usd: 500000',candidates:['atlas']}];
export default function DemoStore({children}) {
 const [deals,setDeals] = useState(()=>JSON.parse(localStorage.getItem('donna-demo-deals')||'null')||initial);
 const save = next => {localStorage.setItem('donna-demo-deals',JSON.stringify(next));setDeals(next);};
 const addDeals = rows => save([...deals,...rows.map(d=>({...d,id:crypto.randomUUID(),status:'unresolved'}))]);
 const resolve = (id,company_id) => save(deals.map(d=>d.id===id?{...d,company_id,status:'resolved',resolution_reason:'Manually selected by the demo reviewer.'}:d));
 return <Context.Provider value={{deals,addDeals,resolve}}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);