import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { liveRequest } from '@/components/donna/live/liveApi';
export default function AddCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const cache = useQueryClient();
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const company = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await liveRequest({ action: 'createCompany', company, request_id: requestId.current });
      await cache.invalidateQueries({ queryKey: ['donna-live'] });
      requestId.current = crypto.randomUUID(); setOpen(false);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={value => { if (!busy) { setOpen(value); setError(''); } }}><DialogTrigger asChild><button className="button-secondary"><Plus size={14}/>Add company</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add a company</DialogTitle><DialogDescription>Only your account can access this company. No sample data is added.</DialogDescription></DialogHeader><form className="space-y-4 mt-2" onSubmit={submit}>
    <label className="form-field"><span>Company name *</span><input name="canonical_name" required maxLength={300} autoFocus placeholder="Company or legal entity name"/></label>
    <label className="form-field"><span>Country code *</span><input name="country" required minLength={2} maxLength={2} pattern="[a-zA-Z]{2}" placeholder="US"/></label>
    <label className="form-field"><span>Registration ID</span><input name="registry_id" maxLength={100} placeholder="Optional, if known"/></label>
    <label className="form-field"><span>Website domain</span><input name="domain" maxLength={253} placeholder="example.com, without https://"/></label>
    <p className="text-xs text-muted-foreground leading-5">Recorded manually, not independently verified. You can add deals from the company page.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save company'}</button>
  </form></DialogContent></Dialog>;
}