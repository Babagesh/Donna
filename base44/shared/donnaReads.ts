import { dealPage, publicCompany } from './donnaPaging.ts';
import { idSchema } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
export async function listDeals(db, user, input) {
  const filter = input.status && input.status !== 'all' ? { status: input.status } : {};
  const [page, groups] = await Promise.all([
    dealPage(db, user.id, filter, input.cursor),
    db.collection('deals').aggregate([{ $match: { book_id: user.id } }, { $group: { _id: '$status', count: { $sum: 1 } } }], { maxTimeMS: 10000 }).toArray()
  ]);
  const summary = { unresolved: 0, needs_review: 0, resolved: 0 };
  for (const group of groups) if (Object.hasOwn(summary, group._id)) summary[group._id] = group.count;
  return { ...page, summary };
}
export async function getCompany(db, user, input) {
  const id = idSchema.parse(input.company_id);
  const company = await db.collection('companies').findOne({ book_id: user.id, company_id: id });
  if (!company) throw new RequestError('Legal entity not found.', 404);
  const query = { book_id: user.id, company_id: id, status: 'resolved' };
  const [deals, totals] = await Promise.all([
    dealPage(db, user.id, { company_id: id, status: 'resolved' }, input.cursor),
    db.collection('deals').aggregate([{ $match: query }, { $group: { _id: null, annual_value_usd: { $sum: '$annual_value_usd' }, deals: { $sum: 1 } } }], { maxTimeMS: 10000 }).toArray()
  ]);
  return { company: publicCompany(company), deals, totals: { annual_value_usd: totals[0]?.annual_value_usd || 0, deals: totals[0]?.deals || 0 }, coverage: { checked: [], failed: [], not_covered: ['Company registry', 'Court records', 'Regulator records', 'Layoff notices', 'News and press', 'Executive moves', 'Job postings', 'Domain and site'] } };
}