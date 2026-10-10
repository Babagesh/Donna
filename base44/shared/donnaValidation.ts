import { z } from 'npm:zod@3.24.2';
const text = (max) => z.string().trim().min(1).max(max);
const optionalNumber = (schema) => z.preprocess(v => v === '' || v == null ? undefined : v, schema.optional());
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => { const d = new Date(value); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value; }, 'Enter a valid date.');
export const dealSchema = z.object({
  title: z.string().trim().max(300).optional(), description: z.string().trim().max(5000).optional(),
  counterparty_name: text(300), country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/),
  deal_class: z.enum(['they_pay_us', 'we_pay_them', 'tied']),
  annual_value_usd: z.coerce.number().finite().min(0).max(1e15), start_date: date, end_date: date,
  notice_days: optionalNumber(z.coerce.number().int().min(0).max(36500)),
  share_pct: optionalNumber(z.coerce.number().finite().min(0).max(100)),
  substitutability: z.enum(['', 'week', 'quarter', 'hard']).optional(),
  owner_email: z.union([z.literal(''), z.string().trim().email().max(254)]).optional(),
  watch_terms: z.string().trim().max(2000).optional()
}).refine(d => d.end_date >= d.start_date, { path: ['end_date'], message: 'End date cannot be before start date.' });
export const companySchema = z.object({ canonical_name: text(300), registry_id: text(100), domain: z.union([z.literal(''), z.string().trim().max(253).regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)]).optional() });
export const standaloneCompanySchema = companySchema.extend({ registry_id: z.string().trim().max(100).optional(), country: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/) });
export const idSchema = text(100);
export const reasonSchema = z.string().trim().min(10, 'Explain your manual decision in at least 10 characters.').max(1000);
export const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('testConnection') }).strict(),
  z.object({ action: z.literal('getBook'), search: z.string().trim().max(200).optional(), sort: z.enum(['name', 'value', 'agreements']).optional(), cursor: z.string().regex(/^\d{1,7}$/).optional() }).strict(),
  z.object({ action: z.literal('listDeals'), status: z.enum(['all', 'unresolved', 'needs_review', 'resolved']).optional(), search: z.string().trim().max(200).optional(), cursor: idSchema.optional() }).strict(),
  z.object({ action: z.literal('getDeal'), deal_id: idSchema }).strict(),
  z.object({ action: z.literal('createCompany'), company: standaloneCompanySchema, request_id: z.string().uuid() }).strict(),
  z.object({ action: z.literal('createDeals'), rows: z.array(dealSchema).min(1).max(100), request_id: z.string().uuid(), company_id: idSchema.optional() }).strict(),
  z.object({ action: z.literal('findCandidates'), deal_id: idSchema, search: z.string().trim().min(1).max(200).optional() }).strict(),
  z.object({ action: z.literal('resolveDeal'), deal_id: idSchema, company_id: idSchema, reason: reasonSchema }).strict(),
  z.object({ action: z.literal('recordAndResolve'), deal_id: idSchema, company: companySchema, reason: reasonSchema }).strict(),
  z.object({ action: z.literal('keepUnresolved'), deal_id: idSchema, reason: reasonSchema.optional() }).strict(),
  z.object({ action: z.literal('getCompany'), company_id: idSchema, cursor: idSchema.optional() }).strict()
]);
export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');