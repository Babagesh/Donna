import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

import { CLERK_PUBLISHABLE_KEY } from '@/lib/clerkConfig';

export default function ClerkRoot({ children }) {
  if (!CLERK_PUBLISHABLE_KEY) return children;
  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}
    signInUrl="/sign-in" signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/"
    taskUrls={{ 'choose-organization': '/', 'reset-password': '/', 'setup-mfa': '/' }}
    afterSignOutUrl="/">
    {children}
  </ClerkProvider>;
}