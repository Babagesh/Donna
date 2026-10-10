import { dealPage, publicCompany, publicDeal } from './donnaPaging.ts';
import { idSchema, escapeRegex } from './donnaValidation.ts';
import { RequestError } from './donnaMongo.ts';
const publicRecord = document => { const { _id, book_id, created_by_id, ...record } = document; return record; };
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
  return { company: publicCompany(company), deals, totals: { annual_value_usd: totals[0]?.annual_value_usd || 0, deals: totals[0]?.deals || 0 }, coverage: company.coverage ?? { checked: [], failed: [], not_covered: ['Company registry', 'Court records', 'Regulator records', 'Layoff notices', 'News and press', 'Executive moves', 'Job postings', 'Domain and site'] } };
}
export async function listSignals(db, user, input) {
  const query = { book_id: user.id };
  if (input.company_id) query.company_id = idSchema.parse(input.company_id);
  if (input.type) query.type = input.type;
  if (input.tier != null) query.tier = input.tier;
  if (input.since) query.first_seen = { $gte: input.since };
  let pageQuery = query;
  if (input.cursor) {
    const previous = await db.collection('signals').findOne({ book_id: user.id, signal_id: idSchema.parse(input.cursor) }, { projection: { first_seen: 1, signal_id: 1 } });
    if (!previous) return { items: [], total: await db.collection('signals').countDocuments(query, { maxTimeMS: 10000 }), has_more: false, next_cursor: null };
    pageQuery = { $and: [query, { $or: [{ first_seen: { $lt: previous.first_seen } }, { first_seen: previous.first_seen, signal_id: { $lt: previous.signal_id } }] }] };
  }
  const [records, total] = await Promise.all([
    db.collection('signals').find(pageQuery).sort({ first_seen: -1, signal_id: -1 }).limit(51).maxTimeMS(10000).toArray(),
    db.collection('signals').countDocuments(query, { maxTimeMS: 10000 })
  ]);
  const hasMore = records.length > 50;
  const items = records.slice(0, 50).map(publicRecord);
  return { items, total, has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].signal_id : null };
}
export async function getBriefing(db, user, input) {
  const account = { book_id: user.id };
  const briefing = input.briefing_id
    ? await db.collection('briefings').findOne({ ...account, briefing_id: idSchema.parse(input.briefing_id) })
    : (await db.collection('briefings').find({ ...account, company_id: idSchema.parse(input.company_id) }).sort({ generated_at: -1, briefing_id: -1 }).limit(1).maxTimeMS(10000).toArray())[0];
  if (!briefing) throw new RequestError('Briefing not found.', 404);
  const [cluster, company] = await Promise.all([
    db.collection('clusters').findOne({ ...account, company_id: briefing.company_id, mode: briefing.mode }),
    db.collection('companies').findOne({ ...account, company_id: briefing.company_id })
  ]);
  if (!cluster) throw new RequestError('The signal cluster behind this briefing is missing. Regenerate the briefing.', 404);
  if (!company) throw new RequestError('Legal entity not found.', 404);
  return { briefing: publicRecord(briefing), cluster: publicRecord(cluster), company: publicCompany(company) };
}
export async function listBriefings(db, user, input) {
  const account = { book_id: user.id };
  const query = { ...account };
  if (input.mode) query.mode = input.mode;
  let pageQuery = query;
  if (input.cursor) {
    const previous = await db.collection('briefings').findOne({ ...account, briefing_id: idSchema.parse(input.cursor) }, { projection: { generated_at: 1, briefing_id: 1 } });
    if (!previous) return { items: [], total: await db.collection('briefings').countDocuments(query, { maxTimeMS: 10000 }), has_more: false, next_cursor: null };
    pageQuery = { $and: [query, { $or: [{ generated_at: { $lt: previous.generated_at } }, { generated_at: previous.generated_at, briefing_id: { $lt: previous.briefing_id } }] }] };
  }
  const [records, total] = await Promise.all([
    db.collection('briefings').aggregate([
      { $match: pageQuery },
      { $sort: { generated_at: -1, briefing_id: -1 } },
      { $limit: 51 },
      { $lookup: { from: 'clusters', let: { company: '$company_id', mode: '$mode' }, pipeline: [
        { $match: { ...account, $expr: { $and: [{ $eq: ['$company_id', '$$company'] }, { $eq: ['$mode', '$$mode'] }] } } },
        { $project: { _id: 0, top_tier: 1 } }
      ], as: 'cluster' } },
      { $lookup: { from: 'companies', let: { company: '$company_id' }, pipeline: [
        { $match: { ...account, $expr: { $eq: ['$company_id', '$$company'] } } },
        { $project: { _id: 0, canonical_name: 1 } }
      ], as: 'entity' } },
      { $set: { top_tier: { $ifNull: [{ $arrayElemAt: ['$cluster.top_tier', 0] }, 0] }, company_name: { $ifNull: [{ $arrayElemAt: ['$entity.canonical_name', 0] }, ''] } } },
      { $unset: ['_id', 'book_id', 'created_by_id', 'cluster', 'entity'] }
    ], { maxTimeMS: 10000 }).toArray(),
    db.collection('briefings').countDocuments(query, { maxTimeMS: 10000 })
  ]);
  const hasMore = records.length > 50;
  const items = records.slice(0, 50);
  return { items, total, has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].briefing_id : null };
}
export async function getEvidence(db, user, input) {
  const account = { book_id: user.id };
  const id = idSchema.parse(input.id);
  const named = await db.collection('signals').findOne({ ...account, signal_id: id });
  const [snapshot, signal] = await Promise.all([
    db.collection('snapshots').findOne({ ...account, snapshot_id: named?.evidence?.[0]?.snapshot_id || id }),
    named ? Promise.resolve(named) : db.collection('signals').findOne({ ...account, 'evidence.snapshot_id': id })
  ]);
  if (!snapshot) return { signal: signal ? publicRecord(signal) : null, snapshot: null, run: null, change: null, envelope: null };
  const [run, change, envelope] = await Promise.all([
    db.collection('collector_runs').findOne({ ...account, run_id: snapshot.run_id }),
    db.collection('changes').findOne({ ...account, snapshot_id: snapshot.snapshot_id }),
    db.collection('collector_envelopes').findOne({ ...account, run_id: snapshot.run_id })
  ]);
  return { signal: signal ? publicRecord(signal) : null, snapshot: publicRecord(snapshot), run: run ? publicRecord(run) : null, change: change ? publicRecord(change) : null, envelope: envelope ? publicRecord(envelope) : null };
}
export async function listRuns(db, user, input) {
  const query = { book_id: user.id };
  if (input.company_id) query.company_id = idSchema.parse(input.company_id);
  if (input.batch_id) query.batch_id = idSchema.parse(input.batch_id);
  const runs = await db.collection('collector_runs').find(query).sort({ started_at: -1, run_id: -1 }).limit(200).maxTimeMS(10000).toArray();
  return { items: runs.map(publicRecord) };
}