import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

import { CLERK_PUBLISHABLE_KEY } from '@/lib/clerkConfig';

export default function ClerkRoot({ children }) {
  const navigate = useNavigate();
  function route(to, replace = false) {
    const target = new URL(to, window.location.origin);
    if (target.origin === window.location.origin) {
      navigate(`${target.pathname}${target.search}${target.hash}`, { replace });
    } else {
      window.location.assign(target.href);
    }
  }
  if (!CLERK_PUBLISHABLE_KEY) return children;
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}
    routerPush={to => route(to)} routerReplace={to => route(to, true)}
    signInUrl="/sign-in" signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/"
    taskUrls={{ 'choose-organization': '/', 'reset-password': '/', 'setup-mfa': '/' }}
    afterSignOutUrl="/">
    {children}
  </ClerkProvider>;
}