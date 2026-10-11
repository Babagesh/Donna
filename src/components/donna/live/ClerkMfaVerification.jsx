import React, { useEffect, useRef, useState } from 'react';
import { useClerk, useReverification, useSession, useUser } from '@clerk/clerk-react';
import { hasVerifiedSecondFactor } from '@/components/donna/live/clerkMfa';

export default function ClerkMfaVerification({ onVerified }) {
  const { session } = useSession();
  const { user } = useUser();
  const clerk = useClerk();
  const started = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const verify = useReverification(async () => {
    const token = await session.getToken({ skipCache: true });
    if (!token) throw new Error('Your session expired. Sign in again.');
    if (hasVerifiedSecondFactor(token)) return { verified: true };
    return { clerk_error: { type: 'forbidden', reason: 'reverification-error', metadata: { reverification: { level: 'second_factor', afterMinutes: 99998 } } } };
  });
  async function submit() {
    setBusy(true); setError('');
    try {
      const result = await verify();
      if (!result?.verified) throw new Error('Second-factor verification is not complete. Please try again.');
      onVerified(session.id);
    } catch (err) {
      setError(err.code === 'reverification_cancelled' ? 'Verification cancelled. Verify your authenticator to continue.' : err.errors?.[0]?.longMessage || err.message);
    } finally { setBusy(false); }
  }
  useEffect(() => {
    if (user?.twoFactorEnabled && !started.current) { started.current = true; submit(); }
  }, [user?.twoFactorEnabled]);
  return <section className="panel p-7 max-w-xl mx-auto">
    <div className="page-kicker">SIGN-IN · SECOND FACTOR</div>
    <h1>Verify your authenticator</h1>
    <p className="text-sm text-muted-foreground mt-3 leading-6">Your companies and deals stay locked until Clerk verifies your authenticator code or a backup code. This also applies after Google sign-in.</p>
    {!user?.twoFactorEnabled && <p className="text-sm text-muted-foreground mt-3">First set up an authenticator in Account security, then return here to verify it.</p>}
    <div className="flex flex-wrap gap-3 mt-5">
      <button className="button-primary" disabled={busy || !user?.twoFactorEnabled} onClick={submit}>{busy ? 'Verifying…' : 'Verify second factor'}</button>
      <button className="button-secondary" disabled={busy} onClick={() => clerk.openUserProfile()}>Account security</button>
      <button className="text-link" disabled={busy} onClick={() => clerk.signOut({ redirectUrl: '/sign-in' })}>Sign out</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}