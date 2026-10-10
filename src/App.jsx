import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginRedirect from '@/components/donna/live/LoginRedirect';
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
import Landing from '@/pages/Landing';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
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
          reachable without an account. */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Landing />} />}>
        <Route element={<ClerkGate />}>
          <Route element={<WorkspaceLayout />}>
            <Route path="/" element={<LiveBook />} />
          </Route>
        </Route>
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
        <Route element={<ClerkGate />}>
          <Route element={<WorkspaceLayout />}>
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App