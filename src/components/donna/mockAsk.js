import { mockSignals, mockDeals, mockCoverage, mockCompanies, mockSnapshots } from '@/components/donna/contractFixtures';
// Read-only fixture equivalents of the four architecture tools; no model or external fetch.
export const list_signals = ({company_id,type,tier,since}={}) => mockSignals.filter(s=>s.status!=='baseline'&&(!company_id||s.company_id===company_id)&&(!type||s.type===type)&&(tier==null||s.tier===tier)&&(!since||s.first_seen>=since));
export const get_deals = (company_id,local=[]) => [...mockDeals,...local.filter(d=>d.status==='resolved')].filter(d=>!company_id||d.company_id===company_id);
export const search_evidence = (query,company_id) => mockSnapshots.filter(s=>(!company_id||s.company_id===company_id)&&s.raw_excerpt.toLowerCase().includes(query.toLowerCase())).map(s=>({snapshot_id:s.snapshot_id,excerpt:s.raw_excerpt,source:s.source,fetched_at:s.fetched_at,company_id:s.company_id})).slice(0,10);
export const get_coverage = company_id => mockCoverage[company_id];
export function askMockDonna(question,companyId,localDeals=[]) {
 const q=question.toLowerCase();const named=mockCompanies.find(c=>q.includes(c.company_id)||q.includes(c.canonical_name.toLowerCase()));const scope=companyId||named?.company_id;
 const verdict=/\b(safe|healthy|health|worry|risk|invest|recommend|breach|standing)\b/.test(q);
 const type=/sue|sued|lawsuit|court|litigation|claim/.test(q)?'litigation':/cfo|ceo|executive|leadership|depart|key.person/.test(q)?'exec_departure':/control|ownership/.test(q)?'change_of_control':/enforcement|regulator/.test(q)?'enforcement':/layoff|workforce/.test(q)?'layoff':null;
 const coverageQuestion=/coverage|checked|failed|gaps|not covered/.test(q);
 const quoted=question.match(/["“]([^"”]+)["”]/)?.[1];
 const signals=list_signals({company_id:scope,type:verdict?undefined:type});
 const broad=/recent|changes|signals|observations|what happened/.test(q);
 const items=(verdict||type||broad)?signals:coverageQuestion?[]:signals.filter(s=>q.split(/\W+/).filter(w=>w.length>3).some(w=>s.summary_fact.toLowerCase().includes(w)));
 const rows=/key.person|which.*deals|watched term/.test(q)?get_deals(scope,localDeals).flatMap(deal=>items.filter(s=>s.company_id===deal.company_id&&s.type==='exec_departure'&&/key_person/i.test(deal.watch_terms||'')&&/Jane Doe/i.test(deal.watch_terms||'')).map(s=>({deal,signal:s}))):[];
 const ids=scope?[scope]:mockCompanies.map(c=>c.company_id);
 return {question,scope:scope||'book',verdict,coverageQuestion,items,rows,evidence:quoted?search_evidence(quoted,scope):[],coverage:ids.map(id=>({company_id:id,...get_coverage(id)}))};
}