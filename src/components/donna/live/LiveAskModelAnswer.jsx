import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Renders the model-written answer returned by the `askDonna` action.
 *
 * The model chose the words; it is never the source of a fact. Every line below
 * has already been through the backend gate: a factual sentence carrying no
 * citation that resolved to a retrieved record was removed before this
 * component saw it, and a draft using reassuring or advisory language was
 * rejected outright rather than edited, in which case this component is not
 * rendered at all and the deterministic answer is shown instead. So each line
 * here is either backed by the records it cites or is a statement of absence.
 *
 * Citations render and link exactly as they do on the deterministic answer, so
 * an answer and the record it rests on stay one click apart. The full
 * deterministic answer is passed as `children` and kept intact underneath.
 * @param {{question:string,answer:any,citationHref:(id:string)=>(string|null),children?:any}} props
 */
export default function LiveAskModelAnswer({ question, answer, citationHref, children }) {
  const lines = answer?.lines || [];
  return <div className="answer-block">
    <p className="font-medium mb-3">{question}</p>

    <div className="space-y-2">
      {lines.map((line, index) => <p className="text-sm leading-6" key={`${index}-${line.text.slice(0, 32)}`}>
        {line.text}
        {(line.citations || []).map(id => {
          const href = citationHref(id);
          return href
            ? <Link className="citation ml-2" key={id} to={href}>[{id}]</Link>
            : <span className="citation ml-2" key={id}>[{id}]</span>;
        })}
      </p>)}
      {!lines.length && <p className="text-sm leading-6">The model returned no line that survived the citation gate, so there is nothing to show from it.</p>}
    </div>

    <p className="mt-3 text-[11px] text-muted-foreground">
      Each line above cites the stored record it rests on. A line that cited nothing was removed before this was shown, and a citation shown without a link names a record that is not on this page.
    </p>

    {children && <details className="mt-4">
      <summary className="text-xs cursor-pointer text-primary">The stored records behind this answer, retrieved without a model</summary>
      <div className="mt-3">{children}</div>
    </details>}
  </div>;
}
