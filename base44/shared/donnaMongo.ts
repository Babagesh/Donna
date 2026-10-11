import { MongoClient } from 'npm:mongodb@6.12.0';
import { secrets } from 'base44:runtime';
import { requestSchema } from './donnaValidation.ts';
import { verifyClerkFactor } from './donnaClerk.ts';

/*
 * Clerk is the ONLY sign-in for this backend.
 *
 * This used to gate on a Base44 session (createClientFromRequest + auth.me())
 * AND a Clerk session AND a second factor: three steps where one does the job.
 * The Base44 session did no work Clerk does not already do -- it only supplied
 * the user id that became `book_id` -- so it is gone, and the Clerk subject is
 * now the identity and the book scope.
 *
 * verifyClerkFactor() in donnaClerk.ts is the whole check. It proves, against
 * the issuer's live JWKS: a valid unexpired RS256 token with exp/iat/sub/sid;
 * an active, non-impersonated session (no `sts: 'pending'`, no `act`); the
 * calling origin (`azp`); and a verified SECOND FACTOR (`fva[1]`). The second
 * factor is still mandatory for every action -- that requirement did not move.
 *
 * Nothing was migrated, and nothing needed to be: `donna_auth_links` was empty,
 * so no identity had ever been recorded against this database. Records written
 * under the old Base44 user ids are simply orphaned under a `book_id` nobody
 * authenticates as any more.
 */
export class RequestError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export async function withDonnaDatabase(req, run) {
  let client;
  try {
    if (req.method !== 'POST') throw new RequestError('Use POST.', 405);
    const text = await req.text();
    if (text.length > 400000) throw new RequestError('Request is too large.', 413);
    let body;
    try { body = JSON.parse(text); } catch { throw new RequestError('Send a valid JSON request.'); }
    const { clerk_token: clerkToken, ...operation } = body;
    body = requestSchema.parse(operation);
    if (body.action === 'testConnection' && user.role !== 'admin') throw new RequestError('Administrator access required.', 403);
    const clerkId = body.action === 'testConnection' ? null : await verifyClerkFactor(clerkToken, req.headers.get('origin'));
    const uri = secrets.get('MONGODB_URI');
    const database = secrets.get('MONGODB_DATABASE');
    if (!uri || !database) throw new RequestError('MongoDB connection settings are missing.', 503);
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 15000, maxPoolSize: 2 });
    await client.connect();
    const db = client.db(database);
    if (clerkId) {
      const link = await db.collection('donna_auth_links').findOneAndUpdate({ _id: user.id }, { $setOnInsert: { clerk_user_id: clerkId, linked_at: new Date().toISOString() } }, { upsert: true, returnDocument: 'after' });
      if (link.clerk_user_id !== clerkId) throw new RequestError('Sign in with the Clerk account linked to this agreement book.', 403);
    }
    const result = await run(db, user, body);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof RequestError) return Response.json({ error: error.message }, { status: error.status });
    if (error?.name === 'ZodError') return Response.json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') }, { status: 400 });
    const causes = Array.from(error?.reason?.servers?.values?.() || []).map(server => {
      const message = `${server.error?.message || ''} ${server.error?.cause?.message || ''}`;
      const category = /not implemented|not supported|not a function|unsupported/i.test(message) ? 'runtime_network_support' : /certificate|cert_/i.test(message) ? 'tls_certificate' : /ssl|tls|handshake/i.test(message) ? 'tls_handshake' : /timed out|timeout/i.test(message) ? 'connection_timeout' : /refused|reset|closed/i.test(message) ? 'connection_refused_or_closed' : /auth|credential/i.test(message) ? 'authentication' : 'network_error';
      return { type: server.error?.name || null, cause_type: server.error?.cause?.name || null, code: typeof server.error?.cause?.code === 'string' ? server.error.cause.code : null, category };
    });
    const diagnostic = { type: error?.name || 'UnknownError', code: typeof error?.code === 'number' ? error.code : null, causes };
    console.error('Donna database operation failed', diagnostic);
    return Response.json({ error: 'The database request could not complete. Check the MongoDB connection and database access, then retry.', diagnostic }, { status: 503 });
  } finally {
    if (client) await client.close();
  }
}