// Deterministic question routing for the live Ask surface.
//
// There is no model call, no embedding and no vector store here, on purpose. A fixed
// set of keyword and pattern rules decides which stored records are retrieved, and the
// sentences in ASK_COPY are the only prose that is ever added to a stored record. That
// is what makes an answer reproducible: the same question over the same records always
// routes the same way.
import { sourceCatalog } from '@/components/donna/contractFixtures';

/**
 * The fixed framing sentences. Nothing here is a verdict, an all-clear or advice, and
 * none of it claims that a term was breached: a signal touches a term that was signed,
 * and a lawyer decides the rest.
 */
export const ASK_COPY = {
  verdict: 'Donna does not provide a health verdict, legal conclusion, or advice. Here are the stored observations and the recorded coverage instead.',
  coverage: 'This is the coverage recorded for your account. An empty check is not proof of absence.',
  none: 'Not observed in what has been checked — this does not establish absence.',
  terms: 'Each row pairs a term that was signed with a stored observation that touches it. A signal touching a watched term is not a finding of breach; a lawyer decides that.',
  termsAction: 'The matched rows are worth asking about with the agreement owner before the next review.',
  evidence: 'The stored excerpt is reproduced as it was collected. It is not a newly validated finding.',
  matches: 'Matching stored records, newest first. Nothing here was written for this answer.',
  noExcerpt: 'The matching records store no excerpt text, which is a gap in the record rather than an absence of change.',
  noTerms: 'No stored signal records a term it touches for these agreements, so every row below shows what was signed and watched with no matching observation.',
  baseline: count => `${count} stored baseline ${count === 1 ? 'record was' : 'records were'} left out: a baseline is a starting state, not something that happened.`,
  untracked: count => `${count} ${count === 1 ? 'agreement records' : 'agreements record'} no watched term, so nothing could be matched against ${count === 1 ? 'it' : 'them'}.`
};

/** A verdict, a legal conclusion or advice. Matched first, and deliberately broadly:
 *  answering a verdict question with observations is safe, missing one is not. */
const VERDICT = [
  /\b(health|healthy|healthier|safe|safer|safety|risk|risks|risky|riskier|exposure|trust|trustworthy|reliable|solvent|insolvent|creditworthy|standing|verdict|conclusion|opinion|judgement|judgment)\b/,
  /\b(advise|advice|recommend|recommends|recommendation|should|shall|ought|must|worth|worry|worried|worrying|concerned|concerning|fine|alright|okay|problem|problematic|flag|flags|red|green)\b/,
  /\b(invest|renew|renewal|terminate|cancel|exit|drop|keep|approve|sign|signing|onboard|offboard|rate|score|grade|assess|assessment|evaluate|evaluation|rank)\b/,
  /\b(do you think|what do you think|good or bad|how bad|how good|go ahead|sign off|due diligence)\b/
];

/** Coverage: what was checked, what failed, what is never covered, and when. */
const COVERAGE = [
  /\b(coverage|covered|cover|covers|checked|check|checks|checking|rechecked|unchecked|recheck)\b/,
  /\b(gap|gaps|blind|blindspot|failed|failing|failure|failures|errored|stale|missing|omitted)\b/,
  /\b(monitor|monitored|monitoring|runs|batch|collection|scope|often|frequency|freshness)\b/,
  /\b(what sources|which sources|how many sources|source coverage|sources failed|last run|collection run|not covered|don't cover|do not cover|never cover|cannot see|can't see|out of scope)\b/
];

/** Watched terms: the join between what a deal signed and what a signal touches. */
const TERMS = [
  /\b(watch term|watch terms|watched term|watched terms|term|terms|clause|clauses|covenant|covenants)\b/,
  /\b(which deals|what deals|which agreements|what agreements|deals affected|affected|impacted|touched|touches|touch)\b/,
  /\b(key person|key_person|keyperson|change of control|change_of_control|litigation cap|assignment|novation|exclusivity|most favoured|most favored|mfn|indemnity|indemnification|notice period|termination right|service level|sla)\b/
];

/** Evidence: the stored excerpt, where it came from, and when it was fetched. */
const EVIDENCE = [
  /\b(evidence|excerpt|excerpts|snapshot|snapshots|citation|citations|cited|verbatim|quote|quoted|wording|prove|proof|provenance|underlying|original|primary)\b/,
  /\b(show me the source|where did this come from|where did that come from|where did it come from|where does this come from|source for|source of|back this up|raw text|source text)\b/
];

/**
 * Topic to stored signal type. Matched against `signal.type` and the stored text.
 * @type {[string, RegExp][]}
 */
const TYPE_RULES = [
  ['litigation', /\b(litigation|litigious|lawsuit|lawsuits|sued|suing|court|courts|claim|claims|docket|writ|summons|injunction|tribunal|defendant|plaintiff|filed against)\b/],
  ['exec_departure', /\b(cfo|ceo|coo|cto|cmo|cio|chair|chairman|chairwoman|officer|officers|executive|executives|leadership|depart|departed|departure|departures|resign|resigned|resignation|stepped down|succession|key person)\b/],
  ['change_of_control', /\b(change of control|ownership|owner|acquisition|acquired|acquire|acquires|merger|merged|takeover|buyout|parent|holdco|shareholder|shareholders|stake|divest|divested)\b/],
  ['enforcement', /\b(enforcement|regulator|regulators|regulatory|sanction|sanctions|fined|penalty|penalties|investigation|investigated|probe|licence|license|revoked|suspended|consent order)\b/],
  ['layoff', /\b(layoff|layoffs|laid off|redundancy|redundancies|workforce|job cuts|headcount|downsizing|restructuring|warn notice|plant closing|furlough)\b/],
  ['hiring', /\b(hiring|hires|job posting|job postings|vacancy|vacancies|open roles|careers|recruitment|recruiting)\b/],
  ['domain', /\b(domain|website|site|dns|homepage|web page|certificate)\b/]
];

/** "What changed recently" style questions: every observed signal in scope, no narrowing. */
const BROAD = /\b(recent|recently|latest|newest|new|changed|change|changes|signal|signals|observation|observations|observed|happened|anything|everything|update|updates|news|timeline|activity)\b/;

const STOPWORDS = new Set([
  'what', 'which', 'when', 'where', 'whom', 'whose', 'that', 'this', 'these', 'those', 'have', 'have', 'has', 'had',
  'does', 'did', 'done', 'with', 'from', 'about', 'into', 'over', 'under', 'their', 'they', 'them', 'there', 'been',
  'being', 'were', 'was', 'are', 'and', 'the', 'for', 'any', 'all', 'our', 'your', 'show', 'tell', 'give', 'list',
  'find', 'look', 'donna', 'please', 'counterparty', 'counterparties', 'company', 'companies', 'deal', 'deals',
  'agreement', 'agreements', 'signal', 'signals', 'record', 'records', 'stored', 'anything', 'everything',
  'something', 'recent', 'recently', 'latest', 'newest', 'book', 'mine', 'more', 'most', 'some', 'much', 'many',
  'just', 'only', 'also', 'then', 'than', 'know', 'want', 'need', 'here', 'into', 'onto'
]);

const hits = (patterns, text) => patterns.some(pattern => pattern.test(text));

/** Distinctive words a stored record can actually be matched against. */
export const askTokens = text => [...new Set(String(text || '').toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 3 && !STOPWORDS.has(word)))];

/**
 * Classify a question into exactly one retrieval plan. Precedence is fixed:
 * verdict first (the refusal must never be missed), then the watched-term join,
 * then coverage, then evidence, and finally entity/topic retrieval.
 * @param {any} question
 */
export function classifyAsk(question) {
  const raw = String(question || '').trim();
  const text = raw.toLowerCase();
  const quoted = raw.match(/["“”']([^"“”']{2,120})["“”']/)?.[1]?.trim() || null;
  const verdict = hits(VERDICT, text);
  const termsQuestion = hits(TERMS, text);
  const coverageQuestion = hits(COVERAGE, text);
  const evidenceQuestion = hits(EVIDENCE, text) || Boolean(quoted);
  const types = TYPE_RULES.filter(([, pattern]) => pattern.test(text)).map(([type]) => type);
  const sources = sourceCatalog.filter(source => new RegExp(`\\b${source.id}\\b`).test(text) || text.includes(source.label.toLowerCase())).map(source => source.id);
  // "recent", "changed", "latest" and friends narrow nothing, so they are not keywords:
  // left in, "show me recent litigation" would also return every unrelated signal.
  const keywords = askTokens(text).filter(word => !BROAD.test(word));
  const kind = verdict ? 'verdict' : termsQuestion ? 'terms' : coverageQuestion ? 'coverage' : evidenceQuestion ? 'evidence' : 'topic';
  // Nothing to narrow by means every observed signal in scope. A verdict question is
  // always broad: the refusal is followed by the stored observations, not by a subset.
  const broad = verdict || (!types.length && !sources.length && !keywords.length);
  return { question: raw, kind, verdict, termsQuestion, coverageQuestion, evidenceQuestion, quoted, types, sources, keywords, broad };
}

/** Example questions, one per retrieval plan, so a demo never depends on live typing. */
export const ASK_EXAMPLES = [
  'Are they safe to renew?',
  'What have you checked, and what failed?',
  'Which deals are affected by a watched term?',
  'Show me recent litigation',
  'Show me the source for the latest signal',
  'Which counterparties have leadership changes?'
];
