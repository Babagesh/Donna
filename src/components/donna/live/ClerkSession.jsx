import React, { useEffect, useState } from 'react';
import { TaskChooseOrganization, TaskResetPassword, TaskSetupMFA, useSession } from '@clerk/clerk-react';
import ClerkMfaVerification from '@/components/donna/live/ClerkMfaVerification';
import { Navigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { setLiveTokenProvider } from '@/components/donna/live/liveApi';
// Clerk sign-in and a verified second factor are required for live views.
export default function ClerkSession({ children, unauthenticatedElement }) {
  const { session, isLoaded } = useSession();
  const accountSession = session?.id || null;
  const { pathname } = useLocation();
  const cache = useQueryClient();
  const [ready, setReady] = useState(null);
  const [verifiedSession, setVerifiedSession] = useState(null);
  const factorAge = session?.factorVerificationAge?.[1];
  const mfaVerified = Boolean(accountSession) && ((Number.isInteger(factorAge) && factorAge >= 0) || verifiedSession === accountSession);
  useEffect(() => {
    const authorized = session?.status === 'active' && mfaVerified;
    setLiveTokenProvider(authorized ? () => session.getToken({ skipCache: true }) : null);
    setReady(authorized ? accountSession : null);
    return () => { setLiveTokenProvider(null); cache.removeQueries({ queryKey: ['donna-live'] }); };
  }, [accountSession, session?.status, mfaVerified, cache]);
  if (!isLoaded) return <div className="page-container" role="status">Loading sign-in…</div>;
  const task = session?.currentTask?.key;
  if (task === 'choose-organization') return <TaskChooseOrganization redirectUrlComplete="/" />;
  if (task === 'reset-password') return <TaskResetPassword redirectUrlComplete="/" />;
  if (task === 'setup-mfa') return <TaskSetupMFA redirectUrlComplete="/" />;
  // A pending session is not signed out: its setup task above must finish.
  if (!session && pathname === '/' && unauthenticatedElement) return unauthenticatedElement;
  if (!session) return <Navigate to="/sign-in" replace />;
  if (session?.status !== 'active') return <p role="status">Completing Clerk account setup…</p>;
  if (!mfaVerified) return <ClerkMfaVerification key={accountSession} onVerified={setVerifiedSession} />;
  if (ready !== accountSession) return <div className="page-container" role="status">Preparing secure access…</div>;
  return children;
}