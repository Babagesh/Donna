import React, { useEffect, useState } from 'react';
import { TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from '@clerk/clerk-react';
import ClerkAuthForm from '@/components/donna/live/ClerkAuthForm';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setLiveTokenProvider } from '@/components/donna/live/liveApi';
// Clerk sign-in protects live views; MFA is not required by this app.
export default function ClerkSession({ children, unauthenticatedElement }) {
  const { session, isLoaded, isSignedIn } = useSession();
  const accountSession = session?.id || null;
  const { pathname } = useLocation();
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
  if (!isSignedIn && pathname.startsWith('/sign-up')) return <ClerkAuthForm registration />;
  // An unauthenticated visitor on a route that has public content (`/`) gets
  // that content, not a sign-in form. This is what Base44's removed
  // ProtectedRoute `unauthenticatedElement` used to do.
  if (!isSignedIn && unauthenticatedElement) return unauthenticatedElement;
  if (!isSignedIn && !pathname.startsWith('/sign-in')) return <Navigate to="/sign-in" replace />;
  if (!isSignedIn) return <ClerkAuthForm />;
  if (session?.status !== 'active') return <p role="status">Completing Clerk account setup…</p>;
  if (ready !== accountSession) return <div className="page-container" role="status">Preparing secure access…</div>;
  return children;
}