import { escapeRegex } from './donnaValidation.ts';

export async function getBook(db, user, input) {
  const account = { book_id: user.id };
  const match = { ...account };
  if (input.search) match.$or = ['canonical_name', 'aliases', 'registry_id'].map(field => ({ [field]: { $regex: escapeRegex(input.search), $options: 'i' } }));
  const sort = input.sort === 'value' ? { annual_value_usd: -1, company_id: 1 } : input.sort === 'agreements' ? { agreements: -1, company_id: 1 } : { canonical_name: 1, company_id: 1 };
  const offset = Number(input.cursor || 0);
  const [result, totals, counterparties] = await Promise.all([
    db.collection('companies').aggregate([
      { $match: match },
      { $project: { _id: 0, company_id: 1, canonical_name: 1, jurisdiction: 1, registry_id: 1, coverage: 1, top_tier: 1, latest_signal: 1, last_checked_at: 1 } },
      { $lookup: { from: 'deals', let: { company: '$company_id' }, pipeline: [
        { $match: { ...account, status: 'resolved', $expr: { $eq: ['$company_id', '$$company'] } } },
        { $group: { _id: null, agreements: { $sum: 1 }, annual_value_usd: { $sum: '$annual_value_usd' } } }
      ], as: 'linked' } },
      { $set: { agreements: { $ifNull: [{ $arrayElemAt: ['$linked.agreements', 0] }, 0] }, annual_value_usd: { $ifNull: [{ $arrayElemAt: ['$linked.annual_value_usd', 0] }, 0] } } },
      { $unset: 'linked' },
      { $facet: { items: [{ $sort: sort }, { $skip: offset }, { $limit: 51 }], total: [{ $count: 'count' }] } }
    ], { maxTimeMS: 10000 }).toArray(),
    db.collection('deals').aggregate([
      { $match: account },
      { $group: { _id: '$status', agreements: { $sum: 1 }, annual_value_usd: { $sum: '$annual_value_usd' } } }
    ], { maxTimeMS: 10000 }).toArray(),
    db.collection('companies').countDocuments(account, { maxTimeMS: 10000 })
  ]);
  const summary = { counterparties, agreements: 0, annual_value_usd: 0, unresolved: 0, needs_review: 0, resolved: 0 };
  for (const row of totals) {
    summary.agreements += row.agreements;
    summary.annual_value_usd += row.annual_value_usd;
    if (['unresolved', 'needs_review', 'resolved'].includes(row._id)) summary[row._id] = row.agreements;
  }
  const page = result[0] || { items: [], total: [] };
  const hasMore = page.items.length > 50;
  return { items: page.items.slice(0, 50), total: page.total[0]?.count || 0, has_more: hasMore, next_cursor: hasMore ? String(offset + 50) : null, summary };
}