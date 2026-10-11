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
import LiveLookup from '@/pages/LiveLookup';
import ClerkGate from '@/components/donna/live/ClerkGate';
import ClerkRoot from '@/components/donna/live/ClerkRoot';
import ClerkAccess from '@/components/donna/live/ClerkAccess';
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
      {/* Authentication pages stay outside the MFA gate so Clerk can finish
          registration, email verification and OAuth without being interrupted.
          All live pages share one gate, including the public landing at `/`. */}
      <Route element={<WorkspaceLayout />}>
        <Route path="/sign-in/*" element={<ClerkAccess />} />
        <Route path="/sign-up/*" element={<ClerkAccess />} />
        <Route element={<ClerkGate unauthenticatedElement={<Landing />} />}>
          <Route path="/" element={<LiveBook />} />
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
          <Route path="/live-lookup" element={<LiveLookup />} />
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