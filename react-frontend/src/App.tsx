import { useAuthContext } from "@asgardeo/auth-react";
import LandingPage from './pages/landing/Landing';
import Dashboard from './pages/dashboard/Dashboard';
import CandidateWelcome from './pages/candidate/Welcome';
import CandidateInterview from './pages/candidate/Interview';
import OrganizationSetup from './pages/onboarding/OrganizationSetup';
import { useState } from 'react';

function App() {
  const { state } = useAuthContext();
  const [hasOrg, setHasOrg] = useState(false);

  // Simple routing for Candidate Pages (MVP)
  // In a real app, use react-router-dom
  const path = window.location.pathname;

  if (path === '/candidate/welcome') {
    return <CandidateWelcome />;
  }
  if (path === '/candidate/interview') {
    return <CandidateInterview />;
  }

  if (state.isAuthenticated) {
    // Mock Check: In real app, check supabase 'recruiters' table
    if (!hasOrg) {
      return <OrganizationSetup onComplete={() => setHasOrg(true)} />;
    }
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default App
