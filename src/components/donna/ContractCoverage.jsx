import React from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { sourceLabel } from '@/components/donna/contractFixtures';
export default function ContractCoverage({coverage,asOf}) {
 if(!coverage)return null;
 return <section className="panel p-5"><div className="flex items-center gap-2"><Info size={15} className="text-muted-foreground"/><h2 className="section-title">Coverage, without assumptions</h2></div>{asOf&&<p className="text-xs text-muted-foreground mt-2">Recorded {new Date(asOf).toLocaleString('en-GB',{timeZone:'UTC'})} UTC</p>}<dl className="contract-coverage"><div><dt>Checked · {coverage.checked.length}</dt><dd>{coverage.checked.map(sourceLabel).join(' · ')||'No successful checks recorded'}</dd></div><div><dt className="flex gap-1 items-center"><AlertCircle size={12}/>Failed · {coverage.failed.length}</dt><dd>{coverage.failed.map(sourceLabel).join(' · ')||'No failures in this recorded batch'}</dd></div><div><dt>Not covered</dt><dd>{coverage.not_covered.join(' · ')}</dd></div></dl><p className="text-[10px] text-muted-foreground mt-4">Coverage is copied from the stored record, not written or summarized by a model.</p></section>;
}