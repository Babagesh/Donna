import React, { useState } from 'react';
import { ArrowUp, Sparkles, ArrowUpRight, RotateCcw } from 'lucide-react';
import { useDemo } from '@/components/donna/DemoStore';
import { askMockDonna } from '@/components/donna/mockAsk';
import AskAnswer from '@/components/donna/AskAnswer';
export default function AskDonna({companyId}){
 const {deals}=useDemo();const [question,setQuestion]=useState('');const [answer,setAnswer]=useState(null);
 const submit=q=>{if(q.trim()){setAnswer(askMockDonna(q.trim(),companyId,deals));setQuestion('');}};
 const suggestions=['Show recent litigation','Which deals have a departed key person?','Which sources failed?'];
 return <section className="ask-panel" id="ask-donna"><div className="flex items-start gap-3"><span className="ask-symbol"><Sparkles size={18}/></span><div className="flex-1"><div className="flex flex-wrap justify-between gap-2"><h2 className="text-[15px] font-semibold">Ask Donna</h2><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Grounded response preview · Mock mode</span></div><p className="mt-1 text-xs text-muted-foreground">Ask about observed signals, deal terms, or gaps in your {companyId?'counterparty record':'book'}.</p></div></div>
 {answer&&<><AskAnswer answer={answer}/><button className="text-link mt-3" onClick={()=>setAnswer(null)}><RotateCcw size={12}/>Clear response</button></>}
 <form onSubmit={e=>{e.preventDefault();submit(question);}} className="ask-input"><input aria-label="Question for Donna" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={500} placeholder="Which counterparties have recent leadership changes?"/><button type="submit" disabled={!question.trim()} aria-label="Ask Donna using mock records"><ArrowUp size={17}/></button></form><div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">{suggestions.map(q=><button onClick={()=>submit(q)} key={q} className="suggested-question">{q}<ArrowUpRight size={10}/></button>)}</div><p className="mt-3 text-[10px] text-muted-foreground">Read-only mock answers, not a live model. Put a phrase in quotation marks to search stored excerpts. Every result retains its citation and coverage.</p></section>;
}