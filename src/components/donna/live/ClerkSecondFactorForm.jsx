import React from 'react';

export default function ClerkSecondFactorForm({ code, setCode, backup, setBackup, busy, onSubmit }) {
  return <form onSubmit={onSubmit} className="mt-5 space-y-4">
    <label className="form-field" htmlFor="clerk-mfa-code">
      {backup ? 'Backup code' : 'Six-digit authenticator code'}
      <input id="clerk-mfa-code" value={code} onChange={event => setCode(event.target.value)}
        autoComplete="one-time-code" inputMode={backup ? 'text' : 'numeric'}
        pattern={backup ? undefined : '[0-9]{6}'} maxLength={backup ? 32 : 6}
        required disabled={busy} autoFocus />
    </label>
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <input type="checkbox" checked={backup} disabled={busy}
        onChange={event => { setBackup(event.target.checked); setCode(''); }} />
      Use a backup code instead
    </label>
    <button type="submit" className="button-primary" disabled={busy || !code.trim()}>
      {busy ? 'Verifying…' : 'Verify and continue'}
    </button>
  </form>;
}