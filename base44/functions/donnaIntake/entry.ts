import { withDonnaDatabase } from '../../shared/donnaMongo.ts';
import { requestSchema } from '../../shared/donnaValidation.ts';
import { listDeals, getCompany, getDeal, listSignals, getBriefing, listBriefings, getEvidence, listRuns } from '../../shared/donnaReads.ts';
import { createCompany } from '../../shared/donnaCompanies.ts';
import { getBook } from '../../shared/donnaBook.ts';
import { getBookExposure } from '../../shared/donnaExposure.ts';
import { requestLookup, getLookup } from '../../shared/donnaLookup.ts';
import { createDeals } from '../../shared/donnaDealWrites.ts';
import { findCandidates, resolveDeal, recordAndResolve, keepUnresolved } from '../../shared/donnaResolution.ts';
export default async function(req) {
  return await withDonnaDatabase(req, async (db, user, body) => {
    const input = requestSchema.parse(body);
    if (input.action === 'testConnection') {
      await db.command({ ping: 1 });
      // Reaching here means the Clerk session was verified, exactly as for
      // every other action, including second-factor verification. The only write is the
      // `donna_books` registry upsert that withDonnaDatabase performs for any
      // verified request, so this check is no longer strictly read-only.
      return { ok: true, connected: true, authenticated: true, ping: 'passed', note: 'Connection check; no agreement, company or signal records were read or written. Collection permissions beyond the book registry, and database existence, are not verified.' };
    }
    const handlers = { getBook, getBookExposure, requestLookup, getLookup, listDeals, getDeal, createCompany, createDeals, findCandidates, resolveDeal, recordAndResolve, keepUnresolved, getCompany, listSignals, getBriefing, listBriefings, getEvidence, listRuns };
    return await handlers[input.action](db, user, input);
  });
}