import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { sourceLabel } from '@/components/donna/contractFixtures';
import SignalList from '@/components/donna/SignalList';
import SourceTable from '@/components/donna/SourceTable';
import { ASK_COPY } from '@/components/donna/live/askClassify';

const evidenceHref = id => `/live-evidence/${encodeURIComponent(id)}`;
const labels = ids => (ids || []).map(sourceLabel).join(', ');

/**
 * Renders an assembled answer. Every claim on this page is a stored record shown beside
 * its citation; the only prose added is the fixed framing in ASK_COPY. Citations point at
 * the live routes, so an answer and the record it came from are one click apart.
 * @param {{answer:any,evidence?:any[],gaps?:any[]}} props
 */
export default function LiveAskAnswer({ answer, evidence = [], gaps = [] }) {
  return <div className="answer-block">
    <p className="font-medium mb-3">{answer.question}</p>
    <p className="text-muted-foreground text-xs mb-3">{answer.framing}</p>
    {answer.kind === 'terms' && Boolean(answer.rows.length) && <p className="text-muted-foreground text-xs mb-3">{ASK_COPY.termsAction}</p>}

    {gaps.map(gap => <p className="text-xs mb-3 flex items-start gap-2" key={gap.label} role="alert">
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#a2855d]"/>
      <span>{gap.label} could not be read: {gap.message} That is a gap in this answer, not an absence of change.</span>
    </p>)}

    {Boolean(answer.rows.length) && <div className="table-scroll mb-4">
      <table className="simple-table">
        <caption className="sr-only">Signed agreements, the terms watched on them, and the stored observation that touches each term</caption>
        <thead><tr><th scope="col">Agreement</th><th scope="col">Watched term</th><th scope="col">Stored observation</th></tr></thead>
        <tbody>{answer.rows.map(row => <tr key={row.id}>
          <td><Link to={`/live-company/${encodeURIComponent(row.deal.company_id)}#deals`} className="citation">{row.deal.deal_id || row.deal.counterparty_name || 'Agreement not identified'}</Link></td>
          <td>{row.term}</td>
          <td>{row.signal
            ? <>{row.signal.summary_fact || row.signal.title || 'Observation text not recorded'}
              <Link className="citation ml-2" to={evidenceHref(row.signal.signal_id)}>[{row.signal.signal_id}]</Link>
              <span className="block text-[10px] text-muted-foreground mt-1">{row.signal.confidence || 'unstated'} confidence · {row.signal.status || 'status not recorded'} · touches a term that was signed; a lawyer decides whether that is a breach</span></>
            : <span className="text-[11px]">{ASK_COPY.none}</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>}

    {/* The watched-term table already carries its own citations, so the flat signal list
        is the answer only when there is no table — the same precedence as the fixture. */}
    {!answer.rows.length && Boolean(answer.items.length) && <div className="mb-4"><SignalList signals={answer.items} base="/live-"/></div>}

    {evidence.map(record => <div className="answer-citation" key={record.snapshot_id}>
      <span className="text-[10px] uppercase tracking-widest">Stored excerpt · {record.source_label} · {record.trust} trust</span>
      <p className="mt-1">{record.excerpt || 'The stored snapshot holds no excerpt text, which is a gap in the record.'}</p>
      <Link to={evidenceHref(record.snapshot_id)}>[{record.snapshot_id}] <ArrowUpRight size={11}/></Link>
      <p className="text-[10px] text-muted-foreground">
        {record.company_name} · {record.fetched_at ? `Fetched ${record.fetched_at}` : record.error ? `The fetch time could not be read: ${record.error}` : 'Fetch time not recorded'}
        {record.missing ? ' · No stored snapshot matches this reference, which is a gap in the record.' : ''} · The excerpt is not a newly validated finding.
      </p>
    </div>)}

    {answer.notes.map(note => <p className="mt-3 text-[11px] text-muted-foreground" key={note}>{note}</p>)}

    <details className="mt-4" open={answer.openCoverage}>
      <summary className="text-xs cursor-pointer text-primary">Coverage for {answer.coverage.length} {answer.coverage.length === 1 ? 'counterparty' : 'counterparties'}</summary>
      <div className="mt-3 space-y-3">
        {answer.coverage.map(record => <div className="text-[11px] leading-6 border-t pt-2" key={record.company_id}>
          <Link className="text-primary" to={`/live-company/${encodeURIComponent(record.company_id)}#coverage`}>{record.name}</Link>
          <p>Checked: {labels(record.checked) || 'no source has been successfully checked'}.</p>
          <p>Failed, and still a coverage gap: {labels(record.failed) || 'none recorded'}.</p>
          <p>Never covered: {record.not_covered.join(', ') || 'none recorded'}.</p>
          <p>Last successful check: {record.checked_at || 'not recorded'}.</p>
        </div>)}
        {!answer.coverage.length && <p className="text-[11px]">No coverage record is stored for this scope, so nothing has been checked.</p>}
      </div>
    </details>

    {answer.showRuns && <div className="mt-4">
      {answer.scoped && Boolean(answer.runs.length)
        ? <SourceTable runs={answer.runs} base="/live-" evidenceId={run => run.status === 'failed' ? null : `snap-${run.company_id}-${run.source}`} note="Copied from stored collection runs. Empty means the check returned no items; failed means the source was not successfully checked and remains a coverage gap."/>
        : <div className="text-[11px] leading-6">
          <p className="font-medium">{answer.brokenRuns.length ? `${answer.brokenRuns.length + answer.brokenRunsHidden} collection ${answer.brokenRuns.length + answer.brokenRunsHidden === 1 ? 'run' : 'runs'} did not complete successfully.` : 'No failed collection run is stored for this scope. That is not a statement that every source was checked.'}</p>
          {answer.brokenRuns.map(run => <p key={run.run_id}>
            <Link className="text-primary" to={`/live-company/${encodeURIComponent(run.company_id)}#coverage`}>{run.company_id}</Link> · {sourceLabel(run.source)} · {run.status === 'started' ? 'did not finish' : 'failed'}{run.error ? ` · ${run.error}` : ''}
          </p>)}
          {Boolean(answer.brokenRunsHidden) && <p>{answer.brokenRunsHidden} further unsuccessful {answer.brokenRunsHidden === 1 ? 'run is' : 'runs are'} stored beyond those listed.</p>}
        </div>}
    </div>}

    <p className="mt-4 text-[10px] text-muted-foreground">{answer.scopeLine}</p>
  </div>;
}
