import { companySchema, idSchema, reasonSchema, escapeRegex } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
import { publicCompany, publicDeal } from './donnaPaging.ts';

async function unresolvedDeal(db, user, id) {
  const deal = await db.collection('deals').findOne({ book_id: user.id, deal_id: idSchema.parse(id) });
  if (!deal) throw new RequestError('Deal not found.', 404);
  if (deal.status === 'resolved') throw new RequestError('This deal has already been resolved. Refresh the list.', 409);
  return deal;
}
async function linkDeal(db, user, deal, company, reason) {
  if (company.jurisdiction !== deal.country) throw new RequestError('The entity jurisdiction must match the submitted country.');
  const resolution = { confidence: null, reason, resolved_by: user.id, resolved_at: new Date().toISOString(), candidates_seen: deal.resolution?.candidates_seen || [] };
  if (!resolution.candidates_seen.some(c => c.company_id === company.company_id)) resolution.candidates_seen.push(publicCompany(company));
  const linked = await db.collection('deals').findOneAndUpdate({ book_id: user.id, deal_id: deal.deal_id, status: { $in: ['unresolved', 'needs_review'] } }, { $set: { company_id: company.company_id, status: 'resolved', resolution, updated_date: resolution.resolved_at } }, { returnDocument: 'after' });
  if (!linked) throw new RequestError('The resolution changed. Refresh before trying again.', 409);
  return { deal: publicDeal(linked), company: publicCompany(company) };
}
export async function findCandidates(db, user, input) {
  const deal = await unresolvedDeal(db, user, input.deal_id);
  const search = (input.search || deal.counterparty_name).trim();
  const query = { book_id: user.id, jurisdiction: deal.country, $or: [{ canonical_name: { $regex: escapeRegex(search), $options: 'i' } }, { aliases: { $regex: escapeRegex(search), $options: 'i' } }, { registry_id: { $regex: escapeRegex(search), $options: 'i' } }] };
  const matches = await db.collection('companies').find(query).sort({ canonical_name: 1 }).limit(21).maxTimeMS(10000).toArray();
  const candidates = matches.slice(0, 20).map(publicCompany);
  const now = new Date().toISOString();
  const reason = 'Searched the legal entities already recorded in your book. This is not a registry lookup: the automated registry search runs on its own and records its candidates here.';
  /*
   * MERGE the local matches into whatever is already recorded rather than
   * replacing the resolution subdocument.
   *
   * This used to $set `resolution` wholesale, which destroyed the automated
   * resolution: the orchestrator searches an external registry, records its
   * candidates and its reason, and one click of this button wiped all of it and
   * replaced it with a search of the user's own book -- which, for anyone being
   * onboarded, is empty. The result was a deal that looked unresolvable and a
   * message saying no registry lookup had happened, when one had.
   *
   * `auto_resolver`'s candidates are kept and the local ones appended, deduped
   * on company_id. An automated `confidence` is preserved so the review list can
   * still show how sure the match was.
   */
  const existing = Array.isArray(deal.resolution?.candidates_seen) ? deal.resolution.candidates_seen : [];
  const seen = new Set(existing.map(c => c.company_id || c.registry_id).filter(Boolean));
  const merged = [...existing, ...candidates.filter(c => !seen.has(c.company_id) && !seen.has(c.registry_id))];
  const autoReason = deal.resolution?.resolved_by === 'auto_resolver' && deal.resolution?.reason
    ? `${deal.resolution.reason} ${reason}`
    : reason;
  const updated = await db.collection('deals').findOneAndUpdate({ book_id: user.id, deal_id: deal.deal_id, status: { $in: ['unresolved', 'needs_review'] } }, { $set: { status: 'needs_review', resolution: { confidence: deal.resolution?.confidence ?? null, reason: autoReason, resolved_by: deal.resolution?.resolved_by ?? null, candidates_seen: merged }, updated_date: now } }, { returnDocument: 'after' });
  if (!updated) throw new RequestError('The deal changed. Refresh before trying again.', 409);
  return { deal: publicDeal(updated), candidates: merged, has_more: matches.length > 20 };
}
export async function resolveDeal(db, user, input) {
  const reason = reasonSchema.parse(input.reason);
  const deal = await unresolvedDeal(db, user, input.deal_id);
  const company = await db.collection('companies').findOne({ book_id: user.id, company_id: idSchema.parse(input.company_id) });
  if (!company) throw new RequestError('Legal entity not found in your book.', 404);
  return await linkDeal(db, user, deal, company, reason);
}
export async function recordAndResolve(db, user, input) {
  const reason = reasonSchema.parse(input.reason);
  const fields = companySchema.parse(input.company);
  const deal = await unresolvedDeal(db, user, input.deal_id);
  const now = new Date().toISOString();
  const registryKey = fields.registry_id.toUpperCase();
  await db.collection('companies').createIndex({ book_id: 1, jurisdiction: 1, registry_key: 1 }, { unique: true });
  await db.collection('companies').createIndex({ book_id: 1, company_id: 1 }, { unique: true });
  const company = await db.collection('companies').findOneAndUpdate({ book_id: user.id, jurisdiction: deal.country, registry_key: registryKey }, { $setOnInsert: { book_id: user.id, created_by_id: user.id, company_id: crypto.randomUUID(), canonical_name: fields.canonical_name, aliases: [deal.counterparty_name], registry_id: fields.registry_id, registry_key: registryKey, jurisdiction: deal.country, domains: fields.domain ? [fields.domain.toLowerCase()] : [], resolution: { confidence: null, reason: 'Legal entity entered manually by the analyst. Not independently verified.', resolved_by: user.id }, created_date: now, updated_date: now } }, { upsert: true, returnDocument: 'after' });
  if (company.canonical_name.toLowerCase() !== fields.canonical_name.toLowerCase()) throw new RequestError('This registration is already recorded under another legal name. Search the registration ID and review that entity before confirming.', 409);
  return await linkDeal(db, user, deal, company, reason);
}
export async function keepUnresolved(db, user, input) {
  const deal = await unresolvedDeal(db, user, input.deal_id);
  const reason = input.reason ? reasonSchema.parse(input.reason) : 'No matching legal entity selected; original counterparty name retained.';
  const updated = await db.collection('deals').findOneAndUpdate({ book_id: user.id, deal_id: deal.deal_id, status: { $in: ['unresolved', 'needs_review'] } }, { $set: { status: 'unresolved', resolution: { confidence: null, reason, resolved_by: user.id, candidates_seen: [] }, updated_date: new Date().toISOString() }, $unset: { company_id: '' } }, { returnDocument: 'after' });
  if (!updated) throw new RequestError('The deal changed. Refresh before trying again.', 409);
  return { deal: publicDeal(updated) };
}