// Reads for the live Ask surface, through the Clerk-gated donnaIntake function only.
// The query keys are deliberately identical to the ones LiveBook, LiveCompany,
// LiveCoverage and LiveEvidence already use, so asking a question on one of those pages
// reuses the page's cached records instead of reading the same documents twice. Nothing
// here passes a book_id: the backend scopes every read to the signed-in account.
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { liveRequest } from '@/components/donna/live/liveApi';

const page = { initialPageParam: null, staleTime: 15000, retry: false };

/** Stored signals, newest first. Scoped to one counterparty, or the whole book. */
export function useAskSignals(companyId, enabled) {
  return useInfiniteQuery({
    ...page,
    queryKey: ['donna-live', 'signals', companyId || 'book'],
    queryFn: ({ pageParam }) => liveRequest({ action: 'listSignals', ...(companyId ? { company_id: companyId } : {}), ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: result => result.has_more ? result.next_cursor : undefined,
    enabled
  });
}

/** The book, for counterparty names and the recorded coverage of each one. */
export function useAskBook(enabled) {
  return useInfiniteQuery({
    ...page,
    queryKey: ['donna-live', 'book', '', 'name'],
    queryFn: ({ pageParam }) => liveRequest({ action: 'getBook', search: '', sort: 'name', ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: result => result.has_more ? result.next_cursor : undefined,
    enabled
  });
}

/** One counterparty with its resolved agreements and its coverage record. */
export function useAskCompany(companyId, enabled) {
  return useInfiniteQuery({
    ...page,
    queryKey: ['donna-live', 'company', companyId],
    queryFn: ({ pageParam }) => liveRequest({ action: 'getCompany', company_id: companyId, ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: result => result.deals?.has_more ? result.deals.next_cursor : undefined,
    enabled: Boolean(enabled && companyId)
  });
}

/** Resolved agreements across the book, for the watched-term join. */
export function useAskDeals(enabled) {
  return useInfiniteQuery({
    ...page,
    queryKey: ['donna-live', 'deals', 'resolved', ''],
    queryFn: ({ pageParam }) => liveRequest({ action: 'listDeals', status: 'resolved', search: '', ...(pageParam ? { cursor: pageParam } : {}) }),
    getNextPageParam: result => result.has_more ? result.next_cursor : undefined,
    enabled
  });
}

/** Collection runs, including the failed ones. A failure is a gap, never silence. */
export function useAskRuns(companyId, enabled) {
  return useQuery({
    queryKey: ['donna-live', 'runs', companyId || 'book'],
    queryFn: () => liveRequest({ action: 'listRuns', ...(companyId ? { company_id: companyId } : {}) }),
    staleTime: 15000, retry: false, enabled
  });
}

/**
 * The one model-backed read. Retrieval still happens server-side and stays
 * scoped to the signed-in account, so nothing here passes a book_id either.
 *
 * `answer_status: 'fallback'` is NOT an error: it means no usable model answer
 * exists for this question -- no key configured, nothing citable retrieved, or
 * the draft failed the backend gate -- and the caller renders the deterministic
 * answer instead. A rejected request is the only thing that surfaces as an
 * error, and that path falls back too.
 */
export function useAskDonna(question, companyId, enabled) {
  return useQuery({
    queryKey: ['donna-live', 'ask-donna', companyId || 'book', question],
    queryFn: () => liveRequest({ action: 'askDonna', question, ...(companyId ? { company_id: companyId } : {}) }),
    staleTime: 60000, retry: false, enabled: Boolean(enabled && question)
  });
}

/** One stored snapshot, for the fetch time and the run behind a cited excerpt. */
export function askEvidenceQuery(id) {
  return {
    queryKey: ['donna-live', 'evidence', id],
    queryFn: () => liveRequest({ action: 'getEvidence', id }),
    staleTime: 15000, retry: false
  };
}
