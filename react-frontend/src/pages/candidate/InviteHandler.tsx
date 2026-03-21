/**
 * Invite handler: validates magic-link token from URL, stores candidate data in sessionStorage, redirects to welcome.
 */
import { useEffect, useState } from 'react';
import { EquiHireLogo } from '@/components/ui/Icons';
import { Loader2, XCircle, CheckCircle } from 'lucide-react';
import { API } from '@/lib/api';

export default function InviteHandler() {
    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const validateToken = async () => {
            // Extract token from URL
            const pathParts = window.location.pathname.split('/');
            const token = pathParts[pathParts.length - 1];

            if (!token) {
                setStatus('error');
                setErrorMessage('Invalid invitation link. No token found.');
                return;
            }

            try {
                const data = await API.validateInvitation(token);

                if (!data.valid) {
                    setStatus('error');
                    setErrorMessage(data.message || 'This invitation link is no longer valid.');
                    return;
                }

                // Store candidate data in sessionStorage
                sessionStorage.setItem('candidateData', JSON.stringify({
                    email: data.candidateEmail,
                    name: data.candidateName,
                    jobTitle: data.jobTitle,
                    organizationId: data.organizationId,
                    jobId: data.jobId,
                    invitationId: data.invitationId
                }));

                // Also store the token just in case we need to reference it
                sessionStorage.setItem('invite_token', token);

                setStatus('success');

                // Redirect to welcome page after a brief delay
                setTimeout(() => {
                    window.location.href = '/candidate/welcome';
                }, 1500);

            } catch (error) {
                console.error('Validation error:', error);

                // Handle different error types if needed, for now generic
                setStatus('error');
                setErrorMessage('This invitation link is invalid or does not exist.');
            }
        };

        validateToken();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Logo */}
                <div className="flex items-center justify-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FF7300] to-[#E56700] rounded-2xl shadow-lg flex items-center justify-center">
                        <EquiHireLogo className="h-10 w-auto text-white" />
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                    {status === 'validating' && (
                        <>
                            <Loader2 className="h-16 w-16 text-[#FF7300] animate-spin mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Validating Your Invitation
                            </h2>
                            <p className="text-gray-500">
                                Please wait while we verify your invitation link...
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Invitation Verified! ✓
                            </h2>
                            <p className="text-gray-500">
                                Redirecting you to the interview portal...
                            </p>
                            <div className="mt-4">
                                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#FF7300] animate-pulse" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                                <XCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Invalid Invitation
                            </h2>
                            <p className="text-red-600 mb-4">
                                {errorMessage}
                            </p>
                            <p className="text-sm text-gray-500">
                                Please contact the recruiter who sent you the invitation for assistance.
                            </p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-400 mt-6">
                    Powered by EquiHire Core • Privacy Protected
                </p>
            </div>
        </div>
    );
}
