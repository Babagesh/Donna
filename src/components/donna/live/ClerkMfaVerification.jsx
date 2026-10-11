import React, { useState } from 'react';
import { useClerk, useSession, useUser } from '@clerk/clerk-react';
import { hasVerifiedSecondFactor } from '@/components/donna/live/clerkMfa';
import ClerkSecondFactorForm from '@/components/donna/live/ClerkSecondFactorForm';

export default function ClerkMfaVerification({ onVerified }) {
  const { session } = useSession();
  const { user } = useUser();
  const clerk = useClerk();
  const [code, setCode] = useState('');
  const [backup, setBackup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      await session.startVerification({ level: 'second_factor' });
      const result = await session.attemptSecondFactorVerification({ strategy: backup ? 'backup_code' : 'totp', code: code.trim() });
      if (result.status !== 'complete') throw new Error('Verification is incomplete. Please try again.');
      const token = await result.session.getToken({ skipCache: true });
      if (!hasVerifiedSecondFactor(token)) throw new Error('Clerk has not confirmed your second factor yet. Please try again.');
      onVerified(session.id);
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.message || 'The code could not be verified.');
    } finally { setBusy(false); }
  }
  return <section className="panel p-7 max-w-xl mx-auto">
    <div className="page-kicker">SIGN-IN · SECOND FACTOR</div>
    <h1>Two-factor verification</h1>
    <p className="text-sm text-muted-foreground mt-3 leading-6">Enter the code from your authenticator app to open your private workspace.</p>
    {user?.twoFactorEnabled
      ? <ClerkSecondFactorForm code={code} setCode={setCode} backup={backup} setBackup={setBackup} busy={busy} onSubmit={submit} />
      : <p className="text-sm text-muted-foreground mt-3">Open Account security to add an authenticator app and save your backup codes, then return here to enter your code.</p>}
    <div className="flex flex-wrap gap-3 mt-5">
      <button type="button" className="button-secondary" disabled={busy} onClick={() => clerk.openUserProfile()}>Account security</button>
      <button type="button" className="text-link" disabled={busy} onClick={() => clerk.signOut({ redirectUrl: '/sign-in' })}>Sign out</button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}