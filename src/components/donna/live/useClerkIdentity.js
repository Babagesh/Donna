import { useUser } from '@clerk/clerk-react';
import { CLERK_ENABLED } from '@/lib/clerkConfig';

/**
 * Clerk's useUser(), but safe when Clerk is not configured.
 *
 * ClerkRoot renders its children WITHOUT a ClerkProvider when there is no
 * publishable key. Any component that then calls a Clerk hook throws, so a
 * missing key took out every page carrying workspace chrome instead of
 * degrading -- the opposite of the intended fallback, and it would have been
 * discovered by the whole app going white.
 *
 * Conditioning on CLERK_ENABLED is legal here, and only here, because it is a
 * module-level constant derived at build time. It cannot change between
 * renders, so the hook call order is stable -- which is what the rules of hooks
 * actually require. Do not make this depend on state or props.
 */
export default function useClerkIdentity() {
  if (!CLERK_ENABLED) {
    return { user: null, isLoaded: true, isSignedIn: false, clerkEnabled: false };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks -- guarded by a build-time constant, see above
  const { user, isLoaded, isSignedIn } = useUser();
  return { user, isLoaded, isSignedIn, clerkEnabled: true };
}
