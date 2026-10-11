import React from 'react';
import { useSession } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import ClerkAuthForm from '@/components/donna/live/ClerkAuthForm';

export default function ClerkAccessContent({ registration }) {
  const { session, isLoaded } = useSession();
  if (!isLoaded) return <p role="status">Loading sign-in…</p>;
  if (session?.status === 'active' || session?.status === 'pending') {
    return <Navigate to="/" replace />;
  }
  return <ClerkAuthForm registration={registration} />;
}