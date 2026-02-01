import { useAuthContext } from "@asgardeo/auth-react";
import LandingPage from './pages/landing/Landing';
import Dashboard from './pages/dashboard/Dashboard';
import CandidateWelcome from './pages/candidate/Welcome';
import CandidateInterview from './pages/candidate/Interview';
import InviteHandler from './pages/candidate/InviteHandler';
import OrganizationSetup from './pages/onboarding/OrganizationSetup';
import { useState, useEffect } from 'react';

function App() {
  const { state } = useAuthContext();
  const [hasOrg, setHasOrg] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(false);

  // Simple routing for Candidate Pages (MVP)
  // In a real app, use react-router-dom
  const path = window.location.pathname;

  // Handle magic link invitations
  if (path.startsWith('/invite/')) {
    return <InviteHandler />;
  }

  if (path === '/candidate/welcome') {
    return <CandidateWelcome />;
  }
  if (path === '/candidate/interview') {
    return <CandidateInterview />;
  }

  useEffect(() => {
    const checkOrganization = async () => {
      if (state.isAuthenticated && state.sub) {
        setCheckingOrg(true);
        try {
          const response = await fetch(`http://localhost:9092/api/me/organization?userId=${state.sub}`);
          if (response.ok) {
            setHasOrg(true);
          } else {
            setHasOrg(false);
          }
        } catch (error) {
          console.error("Error checking organization:", error);
          setHasOrg(false); // Default to setup on error for safety
        } finally {
          setCheckingOrg(false);
        }
      }
    };

    checkOrganization();
  }, [state.isAuthenticated, state.sub]);

  if (state.isAuthenticated) {
    if (checkingOrg) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-50 opacity-30"></div>

          {/* Central Logo with Pulsing Effect */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF7300] to-[#E56700] rounded-2xl shadow-lg flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-4xl tracking-tighter">Eh</span>
            </div>

            <h1 className="mt-8 text-2xl font-bold text-gray-900 tracking-tight">
              Equi<span className="text-[#FF7300]">Hire</span>
            </h1>
            <p className="mt-2 text-gray-500 text-sm animate-pulse">Loading your workspace...</p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
      );
    }

    if (!hasOrg) {
      return <OrganizationSetup onComplete={() => setHasOrg(true)} />;
    }
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default App
