import React, { useEffect, useState } from 'react';
import { SignIn, SignUp, TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setLiveTokenProvider } from '@/components/donna/live/liveApi';
// Clerk sign-in protects live views; MFA is not required by this app.
export default function ClerkSession({ children, unauthenticatedElement }) {
  const { session, isLoaded, isSignedIn } = useSession();
  const accountSession = session ? `${session.user.id}:${session.id}` : null;
  const { pathname, search } = useLocation();
  const cache = useQueryClient();
  const [ready, setReady] = useState(null);
  useEffect(() => {
    setLiveTokenProvider(session?.status === 'active' ? () => session.getToken({ skipCache: true }) : null);
    setReady(accountSession);
    return () => { setLiveTokenProvider(null); cache.removeQueries({ queryKey: ['donna-live'] }); };
  }, [accountSession, session?.status, cache]);
  if (!isLoaded) return <div className="page-container" role="status">Loading sign-in…</div>;
  const task = session?.currentTask?.key;
  if (task === 'choose-organization') return <TaskChooseOrganization redirectUrlComplete="/" />;
  if (task === 'reset-password') return <TaskResetPassword redirectUrlComplete="/" />;
  if (task === 'setup-mfa') return <TaskSetupMFA redirectUrlComplete="/" />;
  if (!isSignedIn && pathname === '/sign-up') return <div className="page-container"><div className="page-heading"><div><div className="page-kicker">CREATE ACCOUNT</div><h1>Create your live book account</h1><p>Create your Clerk account to access your private companies and agreements. No two-factor setup is required.</p></div></div><SignUp routing="hash" signInUrl="/sign-in" forceRedirectUrl="/" oauthFlow="popup" /></div>;
  // An unauthenticated visitor on a route that has public content (`/`) gets
  // that content, not a sign-in form. This is what Base44's removed
  // ProtectedRoute `unauthenticatedElement` used to do.
  if (!isSignedIn && unauthenticatedElement) return unauthenticatedElement;
  if (!isSignedIn) return <div className="page-container"><div className="page-heading"><div><div className="page-kicker">CLERK SIGN-IN</div><h1>Sign in to your live book</h1><p>Sign in with Clerk to access your private companies and agreements. No two-factor setup is required.</p></div></div><SignIn routing="hash" signUpUrl="/sign-up" forceRedirectUrl={pathname === '/sign-in' ? '/' : pathname + search} oauthFlow="popup"/></div>;
  if (ready !== accountSession) return <div className="page-container" role="status">Preparing secure access…</div>;
  return children;
}