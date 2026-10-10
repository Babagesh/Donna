import { withDonnaDatabase } from '../../shared/donnaMongo.ts';
import { requestSchema } from '../../shared/donnaValidation.ts';
import { listDeals, getCompany } from '../../shared/donnaReads.ts';
import { createDeals } from '../../shared/donnaDealWrites.ts';
import { findCandidates, resolveDeal, recordAndResolve, keepUnresolved } from '../../shared/donnaResolution.ts';
export default async function(req) {
  return await withDonnaDatabase(req, async (db, user, body) => {
    const input = requestSchema.parse(body);
    if (input.action === 'testConnection') {
      await db.command({ ping: 1 });
      return { ok: true, connected: true, authenticated: true, ping: 'passed', note: 'Read-only connection check; no records were read or written. Collection permissions and database existence are not verified.' };
    }
    const handlers = { listDeals, createDeals, findCandidates, resolveDeal, recordAndResolve, keepUnresolved, getCompany };
    return await handlers[input.action](db, user, input);
  });
}