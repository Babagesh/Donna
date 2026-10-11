import React, { useState } from 'react';
import { useClerk, useSession, useUser, useReverification } from '@clerk/clerk-react';
export default function ClerkSecondFactor({ onVerified }) {
  const { session } = useSession();
  const { user } = useUser();
  const clerk = useClerk();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const verify = useReverification(async () => {
    const token = await session.getToken({ skipCache: true });
    const claims = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null;
    if (!Number.isInteger(claims?.fva?.[1]) || claims.fva[1] < 0) return { clerk_error: { type: 'forbidden', reason: 'reverification-error', metadata: { reverification: { level: 'second_factor', afterMinutes: 99998 } } } };
    return true;
  });
  async function submit() {
    setBusy(true); setError('');
    try { if (await verify()) onVerified(); }
    catch (err) { setError(err.errors?.[0]?.longMessage || err.message || 'Verification was cancelled. Please try again.'); }
    finally { setBusy(false); }
  }
  // Step 2 of 2. Step 1 was the Clerk sign-in form in ClerkSession; these two
  // steps are now the entire sign-in, so they are numbered to read as one
  // sequence rather than as a second sign-in after the first.
  //
  // Someone stuck here -- signed in, no second factor enrolled -- needs a
  // visible way onwards that is not this button: enroll one in account
  // security, sign out, or use the sidebar to browse the sample book, which
  // renders because WorkspaceLayout sits outside the gate.
  return <div className="panel p-7 max-w-2xl"><div className="page-kicker">STEP 2 OF 2 · TWO-FACTOR VERIFICATION</div><h1>Verify your second factor</h1><p className="text-sm text-muted-foreground leading-6 mt-3">You are signed in. This is the last step: live agreements stay locked until Clerk confirms a second factor, and a password, email code, or ordinary sign-in alone does not unlock this book.</p><p className="text-xs text-muted-foreground leading-6 mt-3">If two-factor authentication is not set up, open account security and enroll an authenticator or another supported second factor. Available methods depend on your Clerk settings.</p><div className="flex flex-wrap gap-3 mt-5"><button className="button-secondary" onClick={() => clerk.openUserProfile()}>Account security</button><button className="button-primary" disabled={busy || !user?.twoFactorEnabled} onClick={submit}>{busy ? 'Verifying…' : 'Verify second factor'}</button><button className="text-link" onClick={() => clerk.signOut()}>Sign out</button></div>{!user?.twoFactorEnabled && <p className="text-xs text-muted-foreground mt-3">No second factor enrolled. Set one up in account security before continuing.</p>}<p className="text-xs text-muted-foreground mt-3">Not ready to enroll? The sidebar stays available — the fictional sample book needs no sign-in at all.</p>{error && <p role="alert" className="form-error">{error}</p>}</div>;
}