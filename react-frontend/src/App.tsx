/**
 * @fileoverview Root app: routing and org-gated layout.
 * - Unauthenticated: landing page
 * - Authenticated: check organization; no org → onboarding, else dashboard
 * - Path-based routes for candidate flows (invite handler, welcome, interview)
 */

import { useAuthContext } from '@asgardeo/auth-react';
import { useOrganization } from '@/hooks/useOrganization';
import LandingPage from '@/pages/landing/Landing';
import Dashboard from '@/pages/dashboard/Dashboard';
import CandidateWelcome from '@/pages/candidate/Welcome';
import CandidateInterview from '@/pages/candidate/Interview';
import InviteHandler from '@/pages/candidate/InviteHandler';
import OrganizationSetup from '@/pages/onboarding/OrganizationSetup';
import CandidateTranscript from '@/pages/dashboard/views/CandidateTranscript';
import UserGuide from '@/components/documentation/UserGuide';
import ApiDocs from '@/components/documentation/ApiDocs';
import { LoadingScreen } from '@/components/ui/loading-screen';

function App() {
  const { state } = useAuthContext();
  const isAuthenticated = state?.isAuthenticated === true;
  const userId = isAuthenticated ? state?.sub : undefined;
  const { organization, isLoading: checkingOrg, refresh } = useOrganization({ userId });
  const hasOrg = organization !== null;

  const path = window.location.pathname;

  if (path.startsWith('/invite/')) return <InviteHandler />;
  if (path === '/candidate/welcome') return <CandidateWelcome />;
  if (path === '/candidate/interview') return <CandidateInterview />;
  if (path === '/transcript') return <CandidateTranscript />;
  if (path === '/documentation/guide') return <UserGuide />;
  if (path === '/documentation/api') return <ApiDocs />;

  if (isAuthenticated) {
    if (checkingOrg) {
      return <LoadingScreen message="Loading Workspace..." />;
    }

    if (!hasOrg) {
      return <OrganizationSetup onComplete={() => refresh()} />;
    }
    return <Dashboard />;
  }

  return <LandingPage />;
}

export default App;
