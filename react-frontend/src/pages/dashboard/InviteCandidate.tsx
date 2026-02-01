import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle, Copy, AlertCircle } from "lucide-react";
import { useAuthContext } from "@asgardeo/auth-react";

interface InviteCandidateProps {
    organizationId?: string;
}

export default function InviteCandidate({ organizationId }: InviteCandidateProps) {
    const { state } = useAuthContext();
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [interviewDate, setInterviewDate] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [magicLink, setMagicLink] = useState('');
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSendInvitation = async () => {
        setError('');
        setMagicLink('');

        if (!candidateEmail || !candidateName || !jobTitle) {
            setError('Please fill in all required fields');
            return;
        }

        if (!organizationId || !state.sub) {
            setError('Organization or recruiter information missing');
            return;
        }

        setIsSending(true);

        try {
            const payload = {
                candidateEmail,
                candidateName,
                jobTitle,
                interviewDate: interviewDate || null,
                organizationId,
                recruiterId: state.sub
            };

            const response = await fetch('http://localhost:9092/api/invitations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to send invitation');
            }

            const data = await response.json();
            setMagicLink(data.magicLink);

            // Clear form
            setCandidateEmail('');
            setCandidateName('');
            setJobTitle('');
            setInterviewDate('');

        } catch (err) {
            console.error('Error sending invitation:', err);
            setError('Failed to send invitation. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(magicLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#FF7300] to-[#E56700] text-white">
                <div className="flex items-center">
                    <Mail className="h-6 w-6 mr-2" />
                    <div>
                        <CardTitle>Invite Candidate</CardTitle>
                        <CardDescription className="text-orange-50">
                            Send a magic link invitation for a blind interview
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {magicLink ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-900 mb-1">Invitation Sent Successfully!</h3>
                                    <p className="text-sm text-green-700 mb-3">
                                        An email has been sent to the candidate. You can also share the link directly:
                                    </p>
                                    <div className="bg-white border border-green-300 rounded p-3 mb-3">
                                        <p className="text-xs font-mono text-gray-600 break-all">{magicLink}</p>
                                    </div>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        {copied ? 'Copied!' : 'Copy Link'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setMagicLink('')}
                            className="w-full bg-[#FF7300] hover:bg-[#E56700]"
                        >
                            Send Another Invitation
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="candidateName">Candidate Name *</Label>
                            <Input
                                id="candidateName"
                                placeholder="John Doe"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="candidateEmail">Candidate Email *</Label>
                            <Input
                                id="candidateEmail"
                                type="email"
                                placeholder="candidate@example.com"
                                value={candidateEmail}
                                onChange={(e) => setCandidateEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title *</Label>
                            <Input
                                id="jobTitle"
                                placeholder="Senior Python Engineer"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="interviewDate">Interview Date (Optional)</Label>
                            <Input
                                id="interviewDate"
                                type="datetime-local"
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                            />
                        </div>

                        <Button
                            onClick={handleSendInvitation}
                            disabled={isSending}
                            className="w-full bg-[#FF7300] hover:bg-[#E56700] text-white h-12"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {isSending ? 'Sending...' : 'Send Invitation'}
                        </Button>

                        <p className="text-xs text-gray-500 text-center">
                            The candidate will receive an email with a secure magic link valid for 7 days.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
