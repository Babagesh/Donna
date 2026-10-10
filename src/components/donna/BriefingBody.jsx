import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, FileText } from 'lucide-react';
import { mockSignals } from '@/components/donna/contractFixtures';
import CitationLinks from '@/components/donna/CitationLinks';
import SignalList from '@/components/donna/SignalList';
import CitedNarrative from '@/components/donna/CitedNarrative';
/**
 * A what_changed line is rendered only when its signal_id resolves to a known signal
 * for this company. A line that lost its citation is dropped, never shown uncited.
 * `cluster` may be missing on the live path, so the cluster membership test is skipped
 * rather than silently rejecting every line.
 * @param {{briefing:any,cluster:any,signals?:any[],base?:string,note?:any}} props
 */
export default function BriefingBody({briefing,cluster,signals=mockSignals,base='/',note=null}) {
 const clusterIds=Array.isArray(cluster?.signals)?cluster.signals:null;
 const allowed=id=>Boolean(id)&&(!clusterIds||clusterIds.includes(id))&&signals.some(signal=>signal.signal_id===id&&signal.company_id===briefing.company_id);
 const lines=(briefing.what_changed||[]).filter(line=>allowed(line?.signal_id));
 const citations=briefing.citations||{};
 const fallback=briefing.narration_status==='fallback';
 const defaultNote=fallback?'Sample fallback: narration failed schema validation. The validated signal list remains available.':'Mock narration rendered from the briefing contract. Each factual observation links to its supporting signal.';
 return <><div className="reading-note mb-6"><FileText size={16}/>{note||defaultNote}</div><div className="section-heading"><h2>What changed</h2><span className="eyebrow">{lines.length} CITED OBSERVATIONS</span></div>{fallback?<SignalList signals={signals.filter(signal=>(!clusterIds||clusterIds.includes(signal.signal_id))&&signal.company_id===briefing.company_id)} base={base}/>:<section className="panel p-6 space-y-5">{lines.map((line,index)=><div key={line.signal_id} className="flex gap-4"><span className="observation-index">{String(index+1).padStart(2,'0')}</span><p className="text-sm text-muted-foreground leading-7">{line.text}<CitationLinks ids={[line.signal_id]} companyId={briefing.company_id} signals={signals} base={base}/></p></div>)}{!lines.length&&<p className="text-sm text-muted-foreground leading-7">No observation in this briefing carries a resolvable citation, so no line is shown. This is a gap in the stored record, not a finding that nothing changed.</p>}</section>}{!fallback&&(citations.why_it_matters||[]).some(allowed)&&<section className="panel p-6 mt-6"><h2 className="section-title">Why it matters for this agreement</h2><CitedNarrative text={briefing.why_it_matters} signalIds={(citations.why_it_matters||[]).filter(allowed)} dealIds={citations.deal_context||[]} companyId={briefing.company_id} signals={signals} base={base}/><div className="mt-3 flex flex-wrap gap-2">{(citations.deal_context||[]).map(id=><Link key={id} className="citation" to={`${base}company/${briefing.company_id}#deals`}>[{id}]</Link>)}</div></section>}{(!cluster||cluster.verify_with_counterparty)&&briefing.verify&&<section className="verify-box"><Phone size={18}/><div><h2 className="section-title">Verify with the counterparty</h2><p className="text-sm leading-7 mt-2">{briefing.verify}<CitationLinks ids={(citations.verify||[]).filter(allowed)} signals={signals} base={base}/></p><p className="text-[10px] mt-3">A Tier 1 observation is a prompt for a human conversation, not a verdict.</p></div></section>}{!fallback&&briefing.confidence_note&&<section className="reading-note mt-5"><p><strong>Confidence note. </strong>{briefing.confidence_note}<CitationLinks ids={(citations.confidence_note||[]).filter(allowed)} signals={signals} base={base}/></p></section>}</>;
}
