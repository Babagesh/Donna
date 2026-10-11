import React from 'react';
import { useLocation } from 'react-router-dom';
import { CLERK_ENABLED } from '@/lib/clerkConfig';
import ClerkAccessContent from '@/components/donna/live/ClerkAccessContent';

export default function ClerkAccess() {
  const { pathname } = useLocation();
  if (!CLERK_ENABLED) return <p role="alert">Clerk sign-in is not configured.</p>;
  return <ClerkAccessContent registration={pathname.startsWith('/sign-up')} />;
}