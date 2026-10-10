import React from 'react';
import { Link } from 'react-router-dom';
import { mockRuns, mockSnapshots, sourceLabel } from '@/components/donna/contractFixtures';
const attemptLabel = value => { const date = new Date(value); return Number.isFinite(date.getTime()) ? `${date.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})} · ${date.toISOString().slice(11,16)}` : 'Attempt time not recorded'; };
/**
 * A failed run is reported as a failure, never omitted: an unchecked source is a gap,
 * not silence. `runs` and `evidenceId` let the live path supply stored collection runs
 * and resolve evidence through the snapshot alias instead of the fixture snapshot list.
 * @param {{company?:any,runs?:any[]|null,base?:string,note?:any,evidenceId?:any}} props
 */
export default function SourceTable({company=null,runs=null,base='/',note=null,evidenceId=null}){
 const records=runs||mockRuns.filter(run=>run.batch_id===`batch-${company.id}-2026-10-10`);
 const resolve=evidenceId||(run=>mockSnapshots.find(snapshot=>snapshot.run_id===run.run_id)?.snapshot_id);
 return <div className="panel table-scroll"><table className="simple-table"><thead><tr><th>Source</th><th>Attempt (UTC)</th><th>Result</th><th>Run details</th></tr></thead><tbody>{records.map(run=>{const snapshotId=resolve(run);return <tr key={run.run_id}><td>{sourceLabel(run.source)}</td><td>{attemptLabel(run.started_at)}</td><td>{run.status==='failed'?<span className="gap-label">Failed</span>:run.status==='empty'?'Checked · no items':run.status==='started'?<span className="gap-label">Did not finish</span>:'Checked · items returned'}</td><td><details><summary className="cursor-pointer text-primary text-xs">View run</summary><div className="mt-3 space-y-2 text-[10px]"><p>{run.run_id}</p><p>{run.sandbox_id||'Sandbox not recorded'}</p><p>Credits: {run.credits_spent ?? 'not recorded'}</p>{run.error&&<p>{run.error}</p>}{snapshotId&&<Link className="citation" to={`${base}evidence/${snapshotId}`}>Open snapshot</Link>}</div></details></td></tr>;})}</tbody></table>{!records.length&&<p className="p-6 text-sm text-[#7b826f]">No collection run is recorded for this counterparty. Nothing has been checked, so nothing can be concluded from the absence of signals.</p>}<p className="p-4 text-[10px] text-muted-foreground border-t">{note||'All records are mocked. Empty means the check returned no items; failed means the source was not successfully checked.'}</p></div>;
}
