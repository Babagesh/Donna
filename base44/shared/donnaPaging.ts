export function publicDeal(document) {
  const { _id, book_id, created_by_id, ...deal } = document;
  return { ...deal, id: deal.deal_id };
}
export function publicCompany(document) {
  const { _id, book_id, created_by_id, registry_key, ...company } = document;
  return company;
}
export async function dealPage(db, bookId, conditions = {}, cursor) {
  const query = { book_id: bookId, ...conditions };
  let pageQuery = query;
  if (cursor) {
    const previous = await db.collection('deals').findOne({ book_id: bookId, deal_id: cursor }, { projection: { created_date: 1, deal_id: 1 } });
    if (!previous) return { items: [], has_more: false, next_cursor: null, total: await db.collection('deals').countDocuments(query) };
    pageQuery = { $and: [query, { $or: [{ created_date: { $lt: previous.created_date } }, { created_date: previous.created_date, deal_id: { $lt: previous.deal_id } }] }] };
  }
  const [records, total] = await Promise.all([
    db.collection('deals').find(pageQuery).sort({ created_date: -1, deal_id: -1 }).limit(51).maxTimeMS(10000).toArray(),
    db.collection('deals').countDocuments(query, { maxTimeMS: 10000 })
  ]);
  const hasMore = records.length > 50;
  const items = records.slice(0, 50).map(publicDeal);
  return { items, total, has_more: hasMore, next_cursor: hasMore ? items[items.length - 1].deal_id : null };
}