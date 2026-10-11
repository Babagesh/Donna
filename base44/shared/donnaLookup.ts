/**
 * Pre-deal lookup -- diligence on a counterparty before there is anything to
 * monitor.
 *
 * WHY THIS IS AN INTENT AND NOT A FETCH. The surface never calls Bright Data or
 * Claude; it holds the UI and a thin Mongo API. So a lookup does not run here.
 * It writes a `companies` document carrying `lookup` and no `last_checked_at`,
 * and the orchestrator loop picks that up on its next tick and runs one
 * onboarding pass over the eight sources. Exactly the pattern agreements
 * already use: intake writes `status: unresolved`, the loop resolves it.
 *
 * A lookup is NOT a new kind of record. It is a company without
 * `monitoring_since`. The two fields are independent because all three
 * combinations are real, and the middle one is the point of the feature:
 *
 *   lookup, no monitoring_since  -> looked up, never signed, not watched
 *   lookup + monitoring_since    -> looked up, then signed; history kept
 *   monitoring_since, no lookup  -> arrived as an agreement the ordinary way
 *
 * Companies upsert by registration identity, so signing later reuses this same
 * record and the diligence snapshots become the monitoring baseline rather than
 * being thrown away. The money spent looking becomes the thing later runs
 * compare against.
 */
import { lookupRequestSchema } from './donnaValidation.ts';
import { publicCompany } from './donnaPaging.ts';

export async function requestLookup(db, user, input) {
  const fields = lookupRequestSchema.parse(input.lookup);
  const now = new Date().toISOString();
  const registryKey = fields.registry_id
    ? fields.registry_id.toUpperCase()
    : `MANUAL:${input.request_id}`;

  await db.collection('companies').createIndex(
    { book_id: 1, jurisdiction: 1, registry_key: 1 }, { unique: true },
  );
  await db.collection('companies').createIndex(
    { book_id: 1, company_id: 1 }, { unique: true },
  );

  const lookup = {
    requested_at: now,
    requested_by: user.id,
    // Date-only: the user picks a day, not an instant. Null is the one-shot
    // default -- no schedules, so a company glanced at once cannot cost
    // credits every day forever.
    watch_until: fields.watch_until || null,
  };

  const company = await db.collection('companies').findOneAndUpdate(
    { book_id: user.id, jurisdiction: fields.country, registry_key: registryKey },
    {
      $setOnInsert: {
        book_id: user.id,
        created_by_id: user.id,
        company_id: input.request_id,
        canonical_name: fields.canonical_name,
        jurisdiction: fields.country,
        registry_id: fields.registry_id || '',
        registry_key: registryKey,
        aliases: [],
        domains: fields.domain ? [fields.domain.toLowerCase()] : [],
        resolution: {
          confidence: null,
          reason: 'Entered for pre-deal lookup. Not independently verified yet.',
          resolved_by: null,
        },
        created_date: now,
      },
      // Re-requesting an existing company refreshes the lookup intent rather
      // than duplicating the company. A same-day repeat costs nothing anyway:
      // the fetch cache is keyed by URL plus UTC day.
      $set: { lookup, updated_date: now },
    },
    { upsert: true, returnDocument: 'after' },
  );

  return {
    company: publicCompany(company),
    lookup,
    // The orchestrator has not run yet. The screen says so rather than
    // rendering an empty profile, which would read as "nothing found".
    status: company.last_checked_at ? 'collected' : 'pending',
  };
}

/**
 * Poll for the result. Returns the company, its coverage, and its profile
 * briefing once the orchestrator's pass has produced one.
 *
 * `pending` here means NOT YET CHECKED, which is a different claim from
 * checked-and-clear, and the screen must not collapse the two.
 */
export async function getLookup(db, user, input) {
  const account = { book_id: user.id };
  const company = await db.collection('companies').findOne(
    { ...account, company_id: input.company_id },
    { projection: { _id: 0 }, maxTimeMS: 10000 },
  );
  if (!company) return { company: null, status: 'unknown', briefing: null, runs: [] };

  const [briefing, runs] = await Promise.all([
    db.collection('briefings').findOne(
      { ...account, company_id: input.company_id, mode: 'profile' },
      { projection: { _id: 0 }, sort: { generated_at: -1 }, maxTimeMS: 10000 },
    ),
    db.collection('collector_runs').find(
      { ...account, company_id: input.company_id },
      { projection: { _id: 0, source: 1, status: 1, error: 1, ended_at: 1 }, maxTimeMS: 10000 },
    ).toArray(),
  ]);

  return {
    company: publicCompany(company),
    coverage: company.coverage ?? null,
    watch_until: company.lookup?.watch_until ?? null,
    monitored: Boolean(company.monitoring_since),
    status: briefing ? 'ready' : company.last_checked_at ? 'collected' : 'pending',
    briefing: briefing ?? null,
    runs,
  };
}
