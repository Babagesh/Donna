import React from 'react';
import { Outlet } from 'react-router-dom';
import { CLERK_PUBLISHABLE_KEY } from '@/lib/clerkConfig';
import ClerkSession from '@/components/donna/live/ClerkSession';

export default function ClerkGate({ unauthenticatedElement }) {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="page-container">
        <div className="panel p-7 max-w-2xl">
          <div className="page-kicker">CLERK SIGN-IN GATE</div>
          <h1>Clerk is not connected yet</h1>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Add the publishable key from your Clerk dashboard under API keys, then this gate will require a Clerk
            session before any live agreement view opens.
          </p>
        </div>
      </div>
    );
  }

  return <ClerkSession unauthenticatedElement={unauthenticatedElement}><Outlet /></ClerkSession>;
}