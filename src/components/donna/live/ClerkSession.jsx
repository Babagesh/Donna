import React, { useEffect, useState } from 'react';
import { SignIn, useSession } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import { setLiveTokenProvider } from '@/components/donna/live/liveApi';
import ClerkSecondFactor from '@/components/donna/live/ClerkSecondFactor';
export default function ClerkSession({ children }) {
  const { session, isLoaded, isSignedIn } = useSession();
  const cache = useQueryClient();
  const [ready, setReady] = useState(null);
  const [verifiedSession, setVerifiedSession] = useState(null);
  useEffect(() => {
    setLiveTokenProvider(session ? () => session.getToken() : null);
    setReady(session?.id || null);
    return () => { setLiveTokenProvider(null); cache.removeQueries({ queryKey: ['donna-live'] }); };
  }, [session?.id, cache]);
  if (!isLoaded) return <div className="page-container" role="status">Loading secure sign-in…</div>;
  if (!isSignedIn) return <div className="page-container"><div className="page-heading"><div><h1>Sign in to your live book</h1><p>Clerk sign-in stays inside this page; live data also requires a verified second factor.</p></div></div><SignIn routing="hash" forceRedirectUrl={window.location.href.split('#')[0]}/></div>;
  if (ready !== session.id) return <div className="page-container" role="status">Preparing secure access…</div>;
  const secondFactorAge = session.factorVerificationAge?.[1];
  const verified = Number.isInteger(secondFactorAge) && secondFactorAge >= 0;
  if (!verified && verifiedSession !== session.id) return <div className="page-container"><ClerkSecondFactor onVerified={() => setVerifiedSession(session.id)}/></div>;
  return children;
}