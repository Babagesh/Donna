// Clerk publishable key.
//
// A publishable key is public by design and safe to ship in client code; the
// matching SECRET key never belongs anywhere in this repo.
//
// Read from `VITE_CLERK_PUBLISHABLE_KEY` when the build provides it, so the key
// is configurable per environment. The literal below is the fallback, and it is
// deliberately kept: if this value were ever empty, `ClerkRoot` renders its
// children WITHOUT a `ClerkProvider`, and `WorkspaceFrame` calls Clerk's
// `useUser()` unconditionally -- so every page with workspace chrome would throw
// rather than degrade. A fallback makes that unreachable.
//
// Note: Base44's secrets store feeds the backend Deno runtime (`secrets.get`),
// NOT the Vite build -- a secret named VITE_* does not reach here. Verified by
// inspecting the build environment, which carries only the platform's own
// VITE_BASE44_* vars.
export const CLERK_PUBLISHABLE_KEY =
  import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY
  || 'pk_test_d2VsbC1zY3VscGluLTg4MTMuY2xlcmsuYWNjb3VudHMuZGV2JA';
