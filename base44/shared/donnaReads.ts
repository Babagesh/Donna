import { dealPage, publicCompany, publicDeal } from './donnaPaging.ts';
import { idSchema, escapeRegex } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
export async function listDeals(db, user, input) {
  const filter = input.status && input.status !== 'all' ? { status: input.status } : {};
  if (input.search) filter.$or = ['title', 'counterparty_name', 'watch_terms'].map(field => ({ [field]: { $regex: escapeRegex(input.search), $options: 'i' } }));
  const [page, groups, companies] = await Promise.all([
    dealPage(db, user.id, filter, input.cursor),
    db.collection('deals').aggregate([{ $match: { book_id: user.id } }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$annual_value_usd' } } }], { maxTimeMS: 10000 }).toArray(),
    db.collection('companies').countDocuments({ book_id: user.id }, { maxTimeMS: 10000 })
  ]);
  const summary = { unresolved: 0, needs_review: 0, resolved: 0, agreements: 0, annual_value_usd: 0, companies };
  for (const group of groups) {
    if (['unresolved', 'needs_review', 'resolved'].includes(group._id)) summary[group._id] = group.count;
    summary.agreements += group.count;
    summary.annual_value_usd += group.value;
  }
  return { ...page, summary };
}
export async function getDeal(db, user, input) {
  const deal = await db.collection('deals').findOne({ book_id: user.id, deal_id: idSchema.parse(input.deal_id) });
  if (!deal) throw new RequestError('Deal not found in your workspace.', 404);
  const company = deal.company_id ? await db.collection('companies').findOne({ book_id: user.id, company_id: deal.company_id }) : null;
  return { deal: publicDeal(deal), company: company ? publicCompany(company) : null };
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