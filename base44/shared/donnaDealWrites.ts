import { z } from 'npm:zod@3.24.2';
import { dealSchema } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
export async function createDeals(db, user, input) {
  const rows = z.array(dealSchema).min(1).max(100).parse(input.rows);
  const requestId = z.string().uuid().parse(input.request_id);
  const company = input.company_id ? await db.collection('companies').findOne({ book_id: user.id, company_id: input.company_id }) : null;
  if (input.company_id && !company) throw new RequestError('Company not found in your workspace.', 404);
  if (company && rows.some(row => row.country !== company.jurisdiction)) throw new RequestError('The deal country must match the selected company.');
  const now = new Date().toISOString();
  await db.collection('deals').createIndex({ book_id: 1, created_date: -1, deal_id: -1 });
  await db.collection('deals').createIndex({ book_id: 1, status: 1, company_id: 1 });
  const records = rows.map((row, index) => ({ ...row, _id: `${user.id}:${requestId}:${index}`, book_id: user.id, created_by_id: user.id, deal_id: `${requestId}-${index}`, ...(company ? { company_id: company.company_id } : {}), status: company ? 'resolved' : 'unresolved', resolution: { confidence: null, reason: company ? 'Company selected manually when adding this deal. Not independently verified.' : 'No legal entity selected.', resolved_by: company ? user.id : null, candidates_seen: [], ...(company ? { resolved_at: now } : {}) }, created_date: now, updated_date: now }));
  const result = await db.collection('deals').bulkWrite(records.map(document => ({ updateOne: { filter: { _id: document._id, book_id: user.id }, update: { $setOnInsert: document }, upsert: true } })), { ordered: true });
  return { created: result.upsertedCount, deal_ids: records.map(d => d.deal_id) };
}