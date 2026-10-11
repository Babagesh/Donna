import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import WorkspaceLayout from '@/components/donna/WorkspaceLayout';
import Book from '@/pages/Book';
import Company from '@/pages/Company';
import Briefings from '@/pages/Briefings';
import Briefing from '@/pages/Briefing';
import Evidence from '@/pages/Evidence';
import Intake from '@/pages/Intake';
import Review from '@/pages/Review';
import Coverage from '@/pages/Coverage';
import Plan from '@/pages/Plan';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DealDashboard from '@/pages/DealDashboard';
import DealDetail from '@/pages/DealDetail';
import LiveIntake from '@/pages/LiveIntake';
import LiveBook from '@/pages/LiveBook';
import LiveReview from '@/pages/LiveReview';
import LiveCompany from '@/pages/LiveCompany';
import LiveBriefings from '@/pages/LiveBriefings';
import LiveBriefing from '@/pages/LiveBriefing';
import LiveEvidence from '@/pages/LiveEvidence';
import LiveCoverage from '@/pages/LiveCoverage';
import ClerkGate from '@/components/donna/live/ClerkGate';
import ClerkRoot from '@/components/donna/live/ClerkRoot';
import Landing from '@/pages/Landing';

// Base44's own auth pages. They are the ONLY thing left in this app that
// depends on Base44's session state, and nothing routes anyone to them.
const BASE44_AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password'];

/*
 * Clerk is the ONLY sign-in.
 *
 * There used to be a Base44 gate in front of the Clerk gate: ProtectedRoute
 * (Base44 auth) wrapped the live routes, so a user signed in twice and then
 * verified a second factor -- three steps where one does the job, and the
 * extra one read like a loop. Base44's auth did no work Clerk does not already
 * do: it only supplied the user id that became `book_id`, and the Clerk
 * subject is that id now. So ProtectedRoute and LoginRedirect are gone from
 * these routes, and the only gate left is ClerkGate.
 *
 * This component also used to block the WHOLE app -- public landing page and
 * fictional sample book included -- behind a Base44 `auth.me()` round trip,
 * and could replace it outright with UserNotRegisteredError. Both are now
 * scoped to the Base44 auth pages below, so every other route renders without
 * waiting on, or being refused by, a sign-in the app no longer uses.
 */
const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const onBase44AuthPage = BASE44_AUTH_PAGES.includes(window.location.pathname);

  if (onBase44AuthPage && (isLoadingPublicSettings || isLoadingAuth)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (onBase44AuthPage && authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<WorkspaceLayout />}>
        <Route path="/demo" element={<Book />} />
        <Route path="/company/:id" element={<Company />} />
        <Route path="/briefings" element={<Briefings />} />
        <Route path="/briefing/:id" element={<Briefing />} />
        <Route path="/evidence/:id" element={<Evidence />} />
        <Route path="/intake" element={<Intake />} />
        <Route path="/review" element={<Review />} />
        <Route path="/coverage" element={<Coverage />} />
        <Route path="/plan" element={<Plan />} />
      </Route>
      {/* `/` serves the landing page to a visitor and the monitoring book once
          they are signed in AND past the second factor. One URL, correct content
          for each state: the book never loads before MFA, and the landing is
          reachable without an account.

          `unauthenticatedElement={<Landing />}` is what keeps the first half of
          that true. It used to be a ProtectedRoute prop; now ClerkGate passes it
          to ClerkSession, which returns it instead of the Clerk sign-in form when
          nobody is signed in. Without it a visitor to `/` lands on a sign-in form
          and the public landing page becomes unreachable. */}
      {/* WorkspaceLayout sits OUTSIDE ClerkGate on purpose.

          The gate has three waiting states -- loading, Clerk sign-in, and the
          second factor -- and a user can legitimately sit in one of them for a
          while, in particular on the second factor with nothing enrolled yet.
          With the layout inside the gate, every one of those states rendered
          with no sidebar, so the first page you land on offered no way to go
          anywhere at all. Keeping the layout outside means navigation always
          works, including back out to the unauthenticated sample pages, while
          the main area shows whatever the gate needs.

          The one state that must NOT get the workspace chrome is the landing
          page, which carries its own header and is not a private workspace.
          WorkspaceFrame drops its chrome for exactly that case; see the comment
          there. */}
      <Route element={<WorkspaceLayout />}>
        <Route element={<ClerkGate unauthenticatedElement={<Landing />} />}>
          <Route path="/" element={<LiveBook />} />
        </Route>
      </Route>
      {/* No `unauthenticatedElement` here: these are deep links into live data
          and a dedicated sign-in route, so a visitor should land on step 1 of
          the Clerk sign-in, which is what ClerkSession renders by default. This
          block used to redirect to Base44's `/login`, which is no longer a
          sign-in this app uses. */}
      <Route element={<WorkspaceLayout />}>
        <Route element={<ClerkGate />}>
          <Route path="/sign-in" element={<Navigate to="/" replace />} />
          <Route path="/sign-up" element={<Navigate to="/" replace />} />
          <Route path="/deals" element={<DealDashboard />} />
          <Route path="/deals/:id" element={<DealDetail />} />
          <Route path="/live-book" element={<LiveBook />} />
          <Route path="/live-intake" element={<LiveIntake />} />
          <Route path="/live-review" element={<LiveReview />} />
          <Route path="/live-company/:id" element={<LiveCompany />} />
          <Route path="/live-briefings" element={<LiveBriefings />} />
          <Route path="/live-briefing/:id" element={<LiveBriefing />} />
          <Route path="/live-evidence/:id" element={<LiveEvidence />} />
          <Route path="/live-coverage" element={<LiveCoverage />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <ClerkRoot><AuthenticatedApp /></ClerkRoot>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
