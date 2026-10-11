// Clerk publishable key, read from the Vite environment.
//
// The value is supplied by `define` in vite.config.js, which prefers
// process.env.VITE_CLERK_PUBLISHABLE_KEY and otherwise falls back to the
// instance's own publishable key. A publishable key is public by design and
// safe to ship in client code; the matching SECRET key never belongs in this
// repo at all.
//
// This can be empty in principle, so anything that consumes it must degrade
// rather than throw -- see ClerkRoot, which renders without a ClerkProvider,
// and WorkspaceFrame, which must not call Clerk hooks when there is no
// provider above it.
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_d2VsbC1zY3VscGluLTg4MTMuY2xlcmsuYWNjb3VudHMuZGV2JA';

/** True when Clerk is configured, so callers can avoid its hooks when it is not. */
export const CLERK_ENABLED = Boolean(CLERK_PUBLISHABLE_KEY);