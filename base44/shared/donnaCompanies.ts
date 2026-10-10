import { standaloneCompanySchema } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
import { publicCompany } from './donnaPaging.ts';
export async function createCompany(db, user, input) {
  const fields = standaloneCompanySchema.parse(input.company);
  const now = new Date().toISOString();
  const registryKey = fields.registry_id ? fields.registry_id.toUpperCase() : `MANUAL:${input.request_id}`;
  await db.collection('companies').createIndex({ book_id: 1, jurisdiction: 1, registry_key: 1 }, { unique: true });
  await db.collection('companies').createIndex({ book_id: 1, company_id: 1 }, { unique: true });
  const company = await db.collection('companies').findOneAndUpdate(
    { book_id: user.id, jurisdiction: fields.country, registry_key: registryKey },
    { $setOnInsert: { book_id: user.id, created_by_id: user.id, company_id: input.request_id, canonical_name: fields.canonical_name, jurisdiction: fields.country, registry_id: fields.registry_id || '', registry_key: registryKey, aliases: [], domains: fields.domain ? [fields.domain.toLowerCase()] : [], resolution: { confidence: null, reason: 'Company entered manually. Not independently verified.', resolved_by: user.id }, created_date: now, updated_date: now } },
    { upsert: true, returnDocument: 'after' }
  );
  if (company.canonical_name.toLowerCase() !== fields.canonical_name.toLowerCase()) throw new RequestError('This registration ID already belongs to another company in your workspace.', 409);
  return { company: publicCompany(company) };
}