import { createLocalJWKSet, jwtVerify } from 'npm:jose@5.9.6';
import { RequestError } from './donnaMongo.ts';
const issuer = 'https://well-sculpin-8813.clerk.accounts.dev';

export async function verifyClerkSession(token, origin) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 12000) throw new RequestError('Sign in with Clerk to access your live book.', 401);
  let keys;
  try {
    const response = await fetch(`${issuer}/.well-known/jwks.json`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Key lookup failed.');
    keys = await response.json();
  } catch {
    throw new RequestError('Clerk verification is unavailable. Please try again shortly.', 503);
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(token, createLocalJWKSet(keys), { issuer, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'sid'], clockTolerance: 5 }));
  } catch {
    throw new RequestError('Your Clerk session is invalid or expired. Sign in again.', 401);
  }
  if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || payload.sts === 'pending' || payload.act) throw new RequestError('An active, non-impersonated Clerk session is required.', 403);
  if (origin && payload.azp !== origin) throw new RequestError('The Clerk session does not belong to this application origin.', 403);
  if (!Array.isArray(payload.fva) || !Number.isInteger(payload.fva[1]) || payload.fva[1] < 0) throw new RequestError('Verify your authenticator or backup code before accessing your companies and deals.', 403);
  return payload.sub;
}