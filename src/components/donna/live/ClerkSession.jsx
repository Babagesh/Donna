import React, { useEffect, useState } from 'react';
import { SignIn, SignUp, TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from '@clerk/clerk-react';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setLiveTokenProvider } from '@/components/donna/live/liveApi';
import ClerkSecondFactor from '@/components/donna/live/ClerkSecondFactor';

/*
 * Clerk is the ONLY sign-in. There is no Base44 gate in front of this any
 * more, so this component owns the whole authenticated path:
 *
 *   step 1 of 2  Clerk sign-in
 *   step 2 of 2  second factor  (still mandatory before any live view loads)
 *
 * The steps are numbered on screen on purpose. When this sat behind Base44's
 * own sign-in it was the second of two sign-in forms, and landing on a second
 * form after already signing in read as a loop.
 *
 * `unauthenticatedElement` is what an unauthenticated VISITOR sees instead of
 * the sign-in form. `/` passes the public landing page through it, so one URL
 * serves the right content for each state: landing for a visitor, the
 * monitoring book once past the second factor. Routes that pass nothing get
 * the sign-in form, which is the right answer for a deep link into live data.
 */
export default function ClerkSession({ children, unauthenticatedElement }) {
  const { session, isLoaded, isSignedIn } = useSession();
  const { user } = useAuth();
  const accountSession = session ? `${user?.id}:${session.id}` : null;
  const { pathname, search } = useLocation();
  const cache = useQueryClient();
  const [ready, setReady] = useState(null);
  const [verifiedSession, setVerifiedSession] = useState(null);
  useEffect(() => {
    setLiveTokenProvider(session?.status === 'active' ? () => session.getToken({ skipCache: true }) : null);
    setReady(accountSession);
    return () => { setLiveTokenProvider(null); cache.removeQueries({ queryKey: ['donna-live'] }); };
  }, [accountSession, session?.status, cache]);
  if (!isLoaded) return <div className="page-container" role="status">Loading sign-in…</div>;
  if (!isSignedIn && pathname === '/sign-up') return <div className="page-container"><div className="page-heading"><div><div className="page-kicker">STEP 1 OF 2 · CREATE ACCOUNT</div><h1>Create your live book account</h1><p>Sign up here, then verify a second factor. Those two steps are the whole sign-in — there is no separate account to create.</p></div></div><SignUp routing="hash" signInUrl="/" forceRedirectUrl="/" /></div>;
  // An unauthenticated visitor on a route that has public content (`/`) gets
  // that content, not a sign-in form. This is what Base44's removed
  // ProtectedRoute `unauthenticatedElement` used to do.
  if (!isSignedIn && unauthenticatedElement) return unauthenticatedElement;
  if (!isSignedIn) return <div className="page-container"><div className="page-heading"><div><div className="page-kicker">STEP 1 OF 2 · SIGN IN</div><h1>Sign in to your live book</h1><p>This is the only sign-in. Step 2 verifies a second factor, which live agreement data always requires.</p></div></div><SignIn routing="hash" signUpUrl="/sign-up" forceRedirectUrl={window.location.href.split('#')[0]}/></div>;
  if (ready !== session.id) return <div className="page-container" role="status">Preparing secure access…</div>;
  const secondFactorAge = session.factorVerificationAge?.[1];
  const verified = Number.isInteger(secondFactorAge) && secondFactorAge >= 0;
  if (!verified && verifiedSession !== session.id) return <div className="page-container"><ClerkSecondFactor onVerified={() => setVerifiedSession(session.id)}/></div>;
  return children;
}