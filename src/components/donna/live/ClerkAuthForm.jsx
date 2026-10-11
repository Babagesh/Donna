import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';

export default function ClerkAuthForm({ registration = false }) {
  return <section className="max-w-lg mx-auto py-8">
    <div className="page-heading"><div>
      <div className="page-kicker">YOUR PRIVATE DONNA ACCOUNT</div>
      <h1>{registration ? 'Create your account' : 'Sign in to Donna'}</h1>
      <p>Complete account verification, then verify your authenticator to open your private workspace.</p>
    </div></div>
    {registration
      ? <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" oauthFlow="popup" />
      : <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" oauthFlow="popup" />}
  </section>;
}