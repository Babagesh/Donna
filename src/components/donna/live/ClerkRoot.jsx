import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { CLERK_PUBLISHABLE_KEY } from '@/lib/clerkConfig';

export default function ClerkRoot({ children }) {
  const navigate = useNavigate();
  const route = (to, metadata, replace = false) => {
    const url = new URL(to, window.location.origin);
    if (url.origin !== window.location.origin) {
      if (metadata?.windowNavigate) return metadata.windowNavigate(url.href);
      return window.location.assign(url.href);
    }
    return navigate(url.pathname + url.search + url.hash, { replace });
  };
  if (!CLERK_PUBLISHABLE_KEY) return children;
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}
    routerPush={(to, metadata) => route(to, metadata)}
    routerReplace={(to, metadata) => route(to, metadata, true)}
    signInUrl="/sign-in" signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/"
    taskUrls={{ 'choose-organization': '/', 'reset-password': '/', 'setup-mfa': '/' }}
    afterSignOutUrl="/">
    {children}
  </ClerkProvider>;
}